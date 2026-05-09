const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

// Webhook handler for Stripe
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('Stripe configuration missing');
        }
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`Stripe Webhook received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await handleCheckoutSessionCompleted(session);
                break;
            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                await handlePaymentSucceeded(invoice);
                break;
            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                await handlePaymentFailed(failedInvoice);
                break;
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            case 'customer.subscription.updated':
                const updatedSubscription = event.data.object;
                await handleSubscriptionUpdated(updatedSubscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error(`Error handling webhook: ${err.message}`);
        res.status(500).send('Webhook handler failed');
    }
});

const PLAN_MAP = {
    'prod_TwjVpyvsADJqWW': 'starter',
    'prod_TwjTmknrddXqMv': 'pro',
    'prod_TwjWKCJWkxRnK9': 'premium'
};

const PLAN_LIMITS = {
    'free': 5,
    'starter': 100,
    'pro': 500,
    'premium': 999999 // Unlimited
};

async function handleCheckoutSessionCompleted(session) {
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;
    const productId = session.metadata?.productId;

    if (!userId) {
        console.error('No user ID in session metadata');
        return;
    }

    console.log(`Processing successful payment for user ${userId}`);

    // Check if payment already recorded (Idempotency)
    const existingPayment = await Payment.findOne({ transactionId: session.payment_intent || session.id });
    if (existingPayment) {
        console.log('Payment already processed');
        return;
    }

    // Cancel old active subs to avoid duplicates
    await Subscription.updateMany({ userId: userId, status: 'active' }, { status: 'cancelled' });

    const planType = PLAN_MAP[productId] || 'starter';
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newSubscription = new Subscription({
        userId,
        startDate,
        endDate,
        status: 'active',
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: session.customer,
        planId: productId,
        planType: planType
    });
    const savedSubscription = await newSubscription.save();

    const newPayment = new Payment({
        subscriptionId: savedSubscription._id,
        amount: session.amount_total / 100,
        paymentMethod: 'stripe',
        status: 'completed',
        transactionId: session.payment_intent || session.id,
        paymentDate: new Date()
    });
    await newPayment.save();

    // Sync User Model
    await User.findByIdAndUpdate(userId, {
        subscriptionType: planType,
        generationsLimit: PLAN_LIMITS[planType] || 5
    });

    console.log(`Subscription activated for user ${userId} (${planType})`);
}

async function handleSubscriptionUpdated(stripeSub) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
    if (!subscription) {
        console.warn(`Subscription ${stripeSub.id} not found during update`);
        return;
    }

    // Get new plan details
    const productId = stripeSub.items.data[0].price.product;
    const planType = PLAN_MAP[productId] || 'starter';

    // Update Subscription Model
    subscription.planId = productId;
    subscription.planType = planType;
    subscription.status = stripeSub.status;
    subscription.stripeCustomerId = stripeSub.customer; // Ensure we have latest customer ID

    // Handle cancel_at_period_end
    if (stripeSub.cancel_at_period_end) {
        subscription.endDate = new Date(stripeSub.current_period_end * 1000);
    }

    await subscription.save();

    // Sync User Model
    await User.findByIdAndUpdate(subscription.userId, {
        subscriptionType: planType,
        generationsLimit: PLAN_LIMITS[planType] || 5
    });

    console.log(`Subscription updated for user ${subscription.userId} to ${planType}`);
}

async function handlePaymentSucceeded(invoice) {
    if (!invoice.subscription) return;

    const subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
    if (!subscription) return;

    // Extend subscription
    const currentEnd = new Date(subscription.endDate);
    const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days

    subscription.endDate = newEnd;
    subscription.status = 'active';
    await subscription.save();

    // Record payment
    const newPayment = new Payment({
        subscriptionId: subscription._id,
        amount: invoice.amount_paid / 100,
        paymentMethod: 'stripe',
        status: 'completed',
        transactionId: invoice.payment_intent || invoice.id,
        paymentDate: new Date()
    });
    await newPayment.save();

    // Sync User Model (Just in case status changed back to active)
    await User.findByIdAndUpdate(subscription.userId, {
        subscriptionType: subscription.planType,
        generationsLimit: PLAN_LIMITS[subscription.planType] || 5
    });

    console.log(`Subscription renewed for ${subscription.userId}`);
}

async function handlePaymentFailed(invoice) {
    if (!invoice.subscription) return;

    const subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
    if (!subscription) return;

    subscription.status = 'past_due';
    await subscription.save();

    // Sync User Model (Downgrade risk? Maybe just notify? For now, we keep them on plan until strict enforcement)
    // Optionally: could set to free immediately, but usually we give grace period.
    // user.subscriptionType = 'free'; 

    console.log(`Payment failed for subscription ${invoice.subscription}, marked as past_due`);
}

async function handleSubscriptionDeleted(stripeSub) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
    if (!subscription) return;

    subscription.status = 'cancelled';
    await subscription.save();

    // Sync User Model - Downgrade to Free
    await User.findByIdAndUpdate(subscription.userId, {
        subscriptionType: 'free',
        generationsLimit: PLAN_LIMITS['free']
    });

    console.log(`Subscription ${stripeSub.id} cancelled`);
}

module.exports = router;
