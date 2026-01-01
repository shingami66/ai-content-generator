// src/pages/FeedbackPage.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { feedbackAPI } from '../api/api';
import '../AI.css';

interface FeedbackItem {
  id: number;
  type: 'suggestion' | 'complaint' | 'bug';
  name: string;
  email: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  timestamp: string;
}

const FeedbackPage: React.FC = () => {
  const { isAuthenticated, user, setActivePage } = useAppContext();
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'complaint' | 'bug'>('suggestion');
  const [feedbackData, setFeedbackData] = useState({
    description: ''
  });
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setActivePage('feedback');
  }, [setActivePage]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleRating = (rating: number) => {
    void rating;
    // Rating removed - not used in database
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackData.description) {
      setErrorMessage('Please fill in your feedback');
      return;
    }

    handleRating(0);

    try {
      // Submit to backend - UserID (from logged in user) and Description
      await feedbackAPI.submitFeedback(
        user?.id || null,
        feedbackData.description
      );

      const newFeedback: FeedbackItem = {
        id: Date.now(),
        type: feedbackType,
        name: user?.username || 'Anonymous',
        email: user?.email || '',
        title: feedbackType,
        description: feedbackData.description,
        category: 'general',
        rating: 0,
        timestamp: new Date().toLocaleString()
      };

      setFeedbackList(prev => [newFeedback, ...prev]);
      setSuccessMessage(`Your ${feedbackType} has been submitted successfully! Thank you for your feedback.`);
      setFeedbackData({ description: '' });
      setTimeout(() => setSuccessMessage(''), 5000);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to submit feedback. Please try again.');
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h1>Feedback & Suggestions</h1>
        <p>Your opinion matters! Help us improve our service</p>
      </div>

      <div className="feedback-tabs">
        <button className={`feedback-tab-btn ${feedbackType === 'suggestion' ? 'active' : ''}`} onClick={() => setFeedbackType('suggestion')}>
          💡 Suggestion
        </button>
        <button className={`feedback-tab-btn ${feedbackType === 'complaint' ? 'active' : ''}`} onClick={() => setFeedbackType('complaint')}>
          ⚠️ Complaint
        </button>
        <button className={`feedback-tab-btn ${feedbackType === 'bug' ? 'active' : ''}`} onClick={() => setFeedbackType('bug')}>
          🐛 Bug Report
        </button>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="feedback-form-container">
        <form className="feedback-form" onSubmit={handleSubmitFeedback}>
          <div className="form-group">
            <label>Your Feedback *</label>
            <textarea 
              name="description" 
              value={feedbackData.description} 
              onChange={handleFeedbackChange} 
              placeholder="Tell us your thoughts, suggestions, or report any issues..." 
              maxLength={1000}
              rows={6}
            />
            <div className="char-count">{(feedbackData.description || '').length}/1000</div>
          </div>

          <button type="submit" className="submit-btn">
            Submit {feedbackType === 'suggestion' ? 'Suggestion' : feedbackType === 'complaint' ? 'Complaint' : 'Report'}
          </button>
        </form>
      </div>

      {feedbackList.length > 0 && (
        <div className="feedback-list-section">
          <h2>Recent Submissions</h2>
          {feedbackList.map(feedback => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-item-header">
                <h3>{feedback.title}</h3>
                <span className="feedback-item-time">{feedback.timestamp}</span>
              </div>
              <p className="feedback-item-meta"><strong>From:</strong> {feedback.name} ({feedback.email})</p>
              <p className="feedback-item-meta"><strong>Type:</strong> {feedback.type === 'suggestion' ? 'Suggestion' : feedback.type === 'complaint' ? 'Complaint' : 'Bug Report'}</p>
              <p className="feedback-item-desc">{feedback.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
