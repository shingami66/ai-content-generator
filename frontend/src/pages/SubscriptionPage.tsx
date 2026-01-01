// src/pages/SubscriptionPage.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { subscriptionAPI } from '../api/api';
import '../AI.css';

interface PaymentCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  type: 'Visa' | 'MasterCard' | 'Other';
}

const SubscriptionPage: React.FC = () => {
  const { isAuthenticated, user, setUser, setActivePage } = useAppContext();
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    type: 'Visa' as 'Visa' | 'MasterCard' | 'Other'
  });

  // Load saved cards from localStorage
  useEffect(() => {
    const cards = localStorage.getItem(`paymentCards_${user?.id}`);
    if (cards) {
      setSavedCards(JSON.parse(cards));
    }
  }, [user?.id]);

  useEffect(() => {
    setActivePage('subscription');
    
    // Load current subscription status
    const loadSubscription = async () => {
      if (user && user.id) {
        try {
          const response = await subscriptionAPI.getSubscription(user.id);
          if (response.success) {
            setCurrentSubscription(response.subscription);
            
            // Update user context with subscription type
            if (response.isPremium) {
              setUser({
                ...user,
                subscriptionType: 'premium'
              });
            }
          }
        } catch (error) {
          console.error('Failed to load subscription:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
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

  // Handle direct subscription activation
  const handleSubscribeNow = async () => {
    if (!user || !user.id) return;

    // Require at least one saved card
    if (savedCards.length === 0) {
      alert('Please add a payment method first, then click subscribe.');
      setShowAddCardModal(true);
      return;
    }

    if (isActivating) return;

    setIsActivating(true);
    try {
      const primaryCard = savedCards[0];
      const response = await subscriptionAPI.activateSubscription(user.id, primaryCard.type);

      if (!response.success) {
        throw new Error(response.message || 'Failed to activate subscription');
      }

      // Mark user as premium in context
      setUser({
        ...user,
        subscriptionType: 'premium',
        generationsLimit: 999999,
      });

      // Optionally update currentSubscription with returned data
      setCurrentSubscription((prev: any) => ({
        ...(prev || {}),
        Status: 'active',
        StartDate: new Date(),
        EndDate: response.endDate || new Date(),
      }));

      alert('✅ Subscription activated successfully!');
    } catch (error: any) {
      alert('❌ Failed to activate subscription: ' + (error.message || 'Unknown error'));
    } finally {
      setIsActivating(false);
    }
  };

  // Add new payment card
  const handleAddCard = () => {
    if (!newCard.cardNumber || !newCard.cardHolder || !newCard.expiryDate || !newCard.cvv) {
      alert('Please fill in all fields');
      return;
    }

    // Validate card number (basic validation - flexible for testing)
    const cardNumber = newCard.cardNumber.replace(/\s/g, '');
    // Just ensure it's digits and reasonable length (8-19 digits) for testing purposes
    if (!/^\d+$/.test(cardNumber) || cardNumber.length < 8 || cardNumber.length > 19) {
      alert('Invalid card number. Please ensure it contains only digits and is between 8 and 19 digits.');
      return;
    }

    // Validate expiry date
    const [month, year] = newCard.expiryDate.split('/');
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      alert('Invalid expiry date (use MM/YY format)');
      return;
    }

    // Validate CVV
    if (newCard.cvv.length < 3 || newCard.cvv.length > 4) {
      alert('Invalid CVV code');
      return;
    }

    const card: PaymentCard = {
      id: Date.now().toString(),
      cardNumber: cardNumber.replace(/(.{4})/g, '$1 ').trim(),
      cardHolder: newCard.cardHolder,
      expiryDate: newCard.expiryDate,
      cvv: newCard.cvv,
      type: newCard.type
    };

    const updatedCards = [...savedCards, card];
    setSavedCards(updatedCards);
    localStorage.setItem(`paymentCards_${user?.id}`, JSON.stringify(updatedCards));

    // Reset form
    setNewCard({
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      type: 'Visa'
    });
    setShowAddCardModal(false);
    alert('✅ Card added successfully');
  };

  // Delete payment card
  const handleDeleteCard = (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    const updatedCards = savedCards.filter(card => card.id !== cardId);
    setSavedCards(updatedCards);
    localStorage.setItem(`paymentCards_${user?.id}`, JSON.stringify(updatedCards));
    alert('✅ Card deleted successfully');
  };

  // Format card number for display (mask middle digits)
  const formatCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length <= 4) return cleaned;
    return '**** **** **** ' + cleaned.slice(-4);
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  const isPremium = user?.subscriptionType === 'premium';

  return (
    <div className="subscription-page">
      <section className="subscription-hero">
        <h1>
          <span className="bold">Choose Your</span>{' '}
          <span className="highlight-premium">Premium Plan</span>
        </h1>
        <p className="subtitle">
          {isPremium ? 'You are currently on Premium!' : 'Enjoy unlimited features with AI Plus'}
        </p>
      </section>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
          Loading subscription data...
        </div>
      ) : isPremium && currentSubscription ? (
        <div className="subscription-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="badge">⭐ Active Premium</div>
          <h2 className="plan-title">AI Plus</h2>
          <div className="plan-price">
            $10 <span>/month</span>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Status:</strong> {currentSubscription.Status}
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Started:</strong> {new Date(currentSubscription.StartDate).toLocaleDateString()}
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Expires:</strong> {new Date(currentSubscription.EndDate).toLocaleDateString()}
            </p>
          </div>

          <ul className="plan-features">
            {[
              'Unlimited image generation',
              'Create 4K videos',
              'Priority processing',
              'Access to all art styles',
              '24/7 technical support',
              'Download without watermark',
            ].map((f, i) => (
              <li key={i}>
                <span>{f}</span> <span className="check">✓</span>
              </li>
            ))}
          </ul>

          <button 
            className="subscribe-btn" 
            style={{ background: '#ff6b6b', marginBottom: '1rem' }}
            onClick={handleCancelSubscription}
          >
            Cancel Subscription
          </button>
        </div>
      ) : (
        <div className="subscription-card">
          <div className="badge">⭐ Premium Plan</div>
          <h2 className="plan-title">AI Plus</h2>
          <div className="plan-price">
            $10 <span>/month</span>
          </div>

          <ul className="plan-features">
            {[
              'Unlimited image generation',
              'Create 4K videos',
              'Priority processing',
              'Access to all art styles',
              '24/7 technical support',
              'Download without watermark',
            ].map((f, i) => (
              <li key={i}>
                <span>{f}</span> <span className="check">✓</span>
              </li>
            ))}
          </ul>

          <button className="subscribe-btn" onClick={handleSubscribeNow} disabled={isActivating}>
            {isActivating ? 'Activating subscription...' : '🚀 Subscribe Now'}
          </button>
          <p className="cancel-note">You can cancel your subscription at any time</p>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="payment-overlay" onClick={() => setShowAddCardModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Add New Payment Card</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                Card Type
              </label>
              <select
                value={newCard.type}
                onChange={(e) => setNewCard({ ...newCard, type: e.target.value as 'Visa' | 'MasterCard' | 'Other' })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="Visa">Visa</option>
                <option value="MasterCard">MasterCard</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                Card Number
              </label>
              <input
                type="text"
                value={newCard.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (value.length <= 19 && /^\d*$/.test(value)) {
                    setNewCard({ ...newCard, cardNumber: value });
                  }
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                value={newCard.cardHolder}
                onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value.toUpperCase() })}
                placeholder="JOHN DOE"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                  Expiry Date (MM/YY)
                </label>
                <input
                  type="text"
                  value={newCard.expiryDate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      const formatted = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
                      setNewCard({ ...newCard, expiryDate: formatted });
                    }
                  }}
                  placeholder="12/25"
                  maxLength={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                  CVV
                </label>
                <input
                  type="text"
                  value={newCard.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      setNewCard({ ...newCard, cvv: value });
                    }
                  }}
                  placeholder="123"
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAddCard}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Card
              </button>
              <button
                onClick={() => setShowAddCardModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ccc',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
