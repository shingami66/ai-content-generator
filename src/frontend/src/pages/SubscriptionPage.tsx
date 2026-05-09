import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { subscriptionAPI } from '../api/api';
import { usePaymentSuccess } from '../hooks/usePaymentSuccess';


const SubscriptionPage: React.FC = () => {
  const { isAuthenticated, user, setUser, setActivePage } = useAppContext();
  // Call the hook
  const isProcessingPayment = usePaymentSuccess();

  // Stripe Product IDs
  const PLANS = {
    STARTER: 'prod_TwjVpyvsADJqWW',
    PRO: 'prod_TwjTmknrddXqMv',
    PREMIUM: 'prod_TwjWKCJWkxRnK9'
  };

  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isActivating, setIsActivating] = useState(false);

  // ... (useEffect remains same)

  // Show loading overlay if processing payment
  if (isProcessingPayment) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">جاري تحديث حسابك...</h2>
        <p className="text-gray-400">لا تغلق الصفحة، ستستمتع بمميزات Pro خلال لحظات 🚀</p>
      </div>
    );
  }

  useEffect(() => {
    setActivePage('subscription');

    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');

    // Load current subscription status
    const loadSubscription = async () => {
      if (user && user.id) {
        try {
          // Check if returning from Stripe
          if (success && sessionId) {
            console.log('Returning from Stripe, hook will handle verification...');
          }

          const response = await subscriptionAPI.getSubscription(user.id);
          if (response.success) {
            setCurrentSubscription(response.subscription);

            // Update user context with subscription type
            if (response.subscription) { // Check if subscription exists
              setUser({
                ...user,
                subscriptionType: 'premium',
                generationsLimit: 999999 // Unlimited
              });
            }
          }
        } catch (error) {
          console.error('Failed to load subscription:', error);
        }
      }
    };

    loadSubscription();
  }, [setActivePage, user?.id]);

  const handleCancelSubscription = async () => {
    if (!user || !user.id) return;

    if (!confirm('Are you sure you want to cancel your Premium subscription?')) {
      return;
    }

    try {
      const response = await subscriptionAPI.cancelSubscription(user.id);

      if (response.success) {
        setUser({
          ...user,
          subscriptionType: 'free',
          generationsLimit: 5,
          generationsToday: 0
        });

        setCurrentSubscription(null);
        alert('✅ Subscription cancelled successfully');
      }
    } catch (error: any) {
      alert('❌ Failed to cancel: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle subscription via Stripe Checkout
  const handleSubscribe = async (productId: string) => {
    if (!user || !user.id) return;

    // If user already has a premium subscription, we might want to redirect to customer portal instead
    // For now, we'll allow them to proceed to checkout (Stripe handles upgrades/downgrades if configured)

    setIsActivating(true);
    try {
      const response = await subscriptionAPI.createCheckout(user.id, productId);

      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        alert('Failed to start checkout process');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout: ' + (error.message || 'Unknown error'));
    } finally {
      setIsActivating(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  const isPremium = user?.subscriptionType === 'premium';

  // Mock billing history for now
  const billingHistory = [
    { id: 1, date: '2023-10-01', description: 'Premium Subscription', amount: '$49.00', status: 'Paid' },
    { id: 2, date: '2023-09-01', description: 'Premium Subscription', amount: '$49.00', status: 'Paid' },
    { id: 3, date: '2023-08-01', description: 'Premium Subscription', amount: '$49.00', status: 'Paid' },
  ];

  return (

    <div className="min-h-screen text-white p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 inline-block mb-2">
          Subscription & Billing
        </h1>
        <p className="text-gray-400">Manage your plan, billing details, and invoices.</p>
      </header>

      {/* Section 1: Current Plan */}
      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Current Plan</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isPremium
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                }`}>
                {isPremium ? 'Premium' : 'Starter'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {isPremium
                ? 'Renews on ' + (currentSubscription?.EndDate ? new Date(currentSubscription.EndDate).toLocaleDateString() : 'Next Month')
                : 'Upgrade to unlock premium features'}
            </p>

            <div className="flex gap-6 text-sm">
              <div>
                <span className="block text-gray-400">Image Credits</span>
                <span className="font-bold text-lg">{user?.generationsRemaining || 0}</span>
              </div>
              <div>
                <span className="block text-gray-400">Video Credits</span>
                <span className="font-bold text-lg">{user?.videoCredits || 0}</span>
              </div>
            </div>
          </div>

          <button
            onClick={isPremium ? handleCancelSubscription : () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className={`px-6 py-2 rounded-xl transition duration-300 ${isPremium
              ? 'bg-white/10 hover:bg-white/20 border border-white/10'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105'
              }`}
          >
            {isPremium ? 'Cancel Subscription' : 'Upgrade Plan'}
          </button>
        </div>
      </section>

      {/* Section 2: Pricing Tiers */}
      <section id="pricing">
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Starter</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold">$19</span><span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex gap-2"><span>✓</span> 100 image credits</li>
              <li className="flex gap-2"><span>✓</span> 3 video credits</li>
              <li className="flex gap-2 text-gray-500"><span>✓</span> Watermark included</li>
              <li className="flex gap-2 text-gray-500"><span>✓</span> Standard speed</li>
            </ul>
            <button
              onClick={() => handleSubscribe(PLANS.STARTER)}
              disabled={isActivating || user?.subscriptionType === 'starter' || user?.subscriptionType === 'pro' || user?.subscriptionType === 'premium'}
              className={`w-full py-2 rounded-xl transition duration-300 ${user?.subscriptionType === 'starter' ? 'bg-white/10 text-gray-400 cursor-default'
                : (user?.subscriptionType === 'pro' || user?.subscriptionType === 'premium') ? 'bg-transparent border border-white/10 text-gray-500 hover:text-white'
                  : 'bg-white/10 hover:bg-white/20'
                }`}
            >
              {user?.subscriptionType === 'starter' ? 'Current Plan' : (user?.subscriptionType === 'pro' || user?.subscriptionType === 'premium') ? 'Downgrade' : 'Subscribe'}
            </button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="bg-white/5 backdrop-blur-xl border-2 border-pink-500 rounded-2xl p-6 shadow-2xl flex flex-col transform md:scale-105 relative">
            <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
              <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Most Popular
              </span>
            </div>
            <h3 className="text-lg font-medium text-pink-400 mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold">$49</span><span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex gap-2"><span>✓</span> 500 image credits</li>
              <li className="flex gap-2"><span>✓</span> 10 video credits</li>
              <li className="flex gap-2"><span>✓</span> No watermark</li>
              <li className="flex gap-2"><span>✓</span> Faster generation</li>
              <li className="flex gap-2"><span>✓</span> Priority queue</li>
            </ul>
            <button
              onClick={() => handleSubscribe(PLANS.PRO)}
              disabled={isActivating || user?.subscriptionType === 'pro' || user?.subscriptionType === 'premium'}
              className={`w-full py-2 rounded-xl transition duration-300 font-semibold ${user?.subscriptionType === 'pro' ? 'bg-white/10 text-gray-400 cursor-default shadow-none border border-white/5'
                : user?.subscriptionType === 'premium' ? 'bg-transparent border border-white/10 text-gray-500 hover:text-white'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105 shadow-lg shadow-pink-500/20'
                }`}
            >
              {isActivating ? 'Processing...' : (user?.subscriptionType === 'pro' ? 'Current Plan' : user?.subscriptionType === 'premium' ? 'Downgrade' : 'Upgrade to Pro')}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Premium</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold">$99</span><span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex gap-2"><span>✓</span> 1000 image credits</li>
              <li className="flex gap-2"><span>✓</span> 25 video credits</li>
              <li className="flex gap-2"><span>✓</span> API access</li>
              <li className="flex gap-2"><span>✓</span> Priority support</li>
              <li className="flex gap-2"><span>✓</span> No watermark</li>
            </ul>
            <button
              onClick={() => handleSubscribe(PLANS.PREMIUM)}
              disabled={isActivating || user?.subscriptionType === 'premium'}
              className={`w-full py-2 rounded-xl transition duration-300 ${user?.subscriptionType === 'premium' ? 'bg-white/10 text-gray-400 cursor-default'
                : 'bg-white/10 hover:bg-white/20'
                }`}
            >
              {user?.subscriptionType === 'premium' ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Billing History */}
      <section>
        <h2 className="text-xl font-semibold mb-6">Billing History</h2>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {billingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4">{item.description}</td>
                    <td className="px-6 py-4 text-white font-medium">{item.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${item.status === 'Paid' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        item.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-white transition">
                        ⬇ PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>


    </div>
  );
};

export default SubscriptionPage;
