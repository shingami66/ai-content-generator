const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { validateSubscription } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Get user subscription
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all subscriptions for user
    const subscriptions = await Subscription.find({ userId })
      .sort({ startDate: -1 })
      .lean();

    // Get payments for these subscriptions
    const subscriptionIds = subscriptions.map(sub => sub._id);
    const payments = await Payment.find({ subscriptionId: { $in: subscriptionIds } }).lean();

    // Map payments to subscriptions
    const history = subscriptions.map(sub => {
      const payment = payments.find(p => p.subscriptionId.toString() === sub._id.toString());
      return {
        ...sub,
        PaymentMethod: payment ? payment.paymentMethod : null,
        Amount: payment ? payment.amount : null,
        PaymentDate: payment ? payment.paymentDate : null
      };
    });

    res.json({
      success: true,
      subscription: history[0] || null,
      history: history
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription',
      error: error.message
    });
  }
});

// Activate subscription
router.post('/activate', validateSubscription, authenticateToken, async (req, res) => {
  try {
    const { userId, paymentMethod } = req.body;

    // Create subscription (30 days)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newSubscription = new Subscription({
      userId,
      startDate,
      endDate,
      status: 'active'
    });

    const savedSubscription = await newSubscription.save();

    // Create payment record
    const newPayment = new Payment({
      subscriptionId: savedSubscription._id,
      amount: 10.00,
      paymentMethod,
      state: 'completed'
    });

    await newPayment.save();

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscriptionId: savedSubscription._id,
      endDate: endDate
    });

  } catch (error) {
    console.error('Activate subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate subscription',
      error: error.message
    });
  }
});

// Create Stripe Checkout Session
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    // If stripe is not initialized, try to initialize it
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key missing');
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const { userId, productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    console.log(`Creating checkout for product: ${productId} user: ${userId}`);

    // Fetch the Price ID for this Product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      return res.status(404).json({ success: false, message: 'No price found for this product' });
    }

    const priceId = prices.data[0].id;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${clientUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        productId: productId
      }
    });

    res.json({ success: true, url: session.url });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
});

// Create Stripe Customer Portal Session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key missing');
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const { userId } = req.body;
    // Get user from DB to find stripeCustomerId if we stored it, 
    // OR we might need to retrieve it from a subscription.
    // Assuming we don't store stripeCustomerId explicitly on User yet, 
    // we can try to find an active subscription for this user and get the customer ID from it.

    // However, simplest way often is to query Stripe for a customer with this email if we don't store ID.
    // But let's look at how we create subscriptions.

    // For now, let's assume we can get it from the latest subscription.
    const sub = await Subscription.findOne({ userId }).sort({ startDate: -1 });

    if (!sub || !sub.stripeSubscriptionId) {
      return res.status(404).json({ success: false, message: 'No active subscription found to manage.' });
    }

    // Retrieve subscription from Stripe to get customer ID if we don't have it
    let customerId = sub.stripeCustomerId;

    if (!customerId && sub.stripeSubscriptionId) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      customerId = stripeSub.customer;
    }

    if (!customerId) {
      return res.status(404).json({ success: false, message: 'Could not find Stripe Customer ID.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${clientUrl}/dashboard`,
    });

    res.json({ success: true, url: portalSession.url });

  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session',
      error: error.message
    });
  }
});

// Verify Checkout Session (for immediate update after redirect)
router.post('/verify-session', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    // Safeguard: Ensure userId exists (supports both id and userId conventions)
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      console.error('Critical Error: User ID missing in request context');
      return res.status(401).json({ success: false, message: 'User authentication failed' });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Critical Error: STRIPE_SECRET_KEY missing');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    let session;
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // Retrieve the session from Stripe
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error('Stripe API Error:', stripeError.message);
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({ success: false, message: 'Session not found in Stripe' });
      }
      return res.status(502).json({ success: false, message: 'Payment provider error', error: stripeError.message });
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if paid
    if (session.payment_status === 'paid') {
      // Logic to activate subscription similar to /activate but using Stripe data
      // For now, checks if we already have this subscription to avoid duplicates?
      // Or just update/create.

      const productId = session.metadata.productId; // We passed this in metadata

      // Determine plan type based on productId
      const planMap = {
        'prod_TwjVpyvsADJqWW': 'starter',
        'prod_TwjTmknrddXqMv': 'pro',
        'prod_TwjWKCJWkxRnK9': 'premium'
      };

      const planType = planMap[productId] || 'starter'; // Default to starter if unknown

      // Update/Create Subscription
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      // Find existing active or create new
      let subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'past_due'] } // check for past_due as well to reactivate
      });

      if (!subscription) {
        subscription = new Subscription({
          userId,
          startDate,
          endDate,
          status: 'active',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          planId: productId,
          planType: planType
        });
        await subscription.save();
      } else {
        // Extend or update
        subscription.endDate = endDate;
        subscription.stripeSubscriptionId = session.subscription;
        subscription.stripeCustomerId = session.customer;
        subscription.planId = productId;
        subscription.planType = planType;
        subscription.status = 'active'; // Reactivate if it was past_due
        await subscription.save();
      }

      // Record payment if not exists
      const existingPayment = await Payment.findOne({ transactionId: session.payment_intent || session.id });
      if (!existingPayment) {
        const newPayment = new Payment({
          subscriptionId: subscription._id,
          amount: session.amount_total / 100,
          paymentMethod: 'stripe',
          status: 'completed',
          transactionId: session.payment_intent || session.id,
          paymentDate: new Date()
        });
        await newPayment.save();
      }

      // Update User Cache
      const User = require('../models/User');
      const PLAN_LIMITS = {
        free: 5,
        starter: 100,
        pro: 500,
        premium: 1000
      };

      await User.findByIdAndUpdate(userId, {
        subscriptionType: planType,
        generationsLimit: PLAN_LIMITS[planType] || 5
      });

      return res.json({ success: true, message: 'Subscription verified and updated', subscription });
    } else {
      return res.json({ success: false, message: 'Payment not completed' });
    }

  } catch (error) {
    console.error('Verify session error (Internal):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify session',
      error: error.message
    });
  }
});

module.exports = router;