// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { userAPI } from '../api/api';
import '../AI.css';

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user, setUser, setActivePage } = useAppContext();
  const [profileData, setProfileData] = useState({
    username: '',
    email: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActivePage('profile');
    
    // Load user profile from database
    const loadProfile = async () => {
      if (user && user.id) {
        try {
          const response = await userAPI.getProfile(user.id);
          if (response.success) {
            setProfileData({
              username: response.user.Username || response.user.username,
              email: response.user.Email || response.user.email
            });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (user) {
        // Use data from context if no ID
        setProfileData({
          username: user.username,
          email: user.email
        });
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [setActivePage, user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (!profileData.username || !profileData.email) {
      setProfileError('Please provide username and email.');
      return;
    }

    if (profilePassword || profileConfirmPassword) {
      if (profilePassword !== profileConfirmPassword) {
        setProfileError('Passwords do not match.');
        return;
      }
    }

    try {
      // Update profile in database
      if (user && user.id) {
        const response = await userAPI.updateProfile(
          user.id,
          profileData.username,
          profileData.email
        );

        if (response.success) {
          // Update context with new data
          setUser({
            ...user,
            username: profileData.username,
            email: profileData.email
          });

          setIsEditingProfile(false);
          setProfilePassword('');
          setProfileConfirmPassword('');
          setProfileSuccess('Profile updated successfully.');
          setTimeout(() => setProfileSuccess(''), 3000);
        }
      }
    } catch (error: any) {
      setProfileError(error.message || 'Failed to update profile');
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isLoading) return <div className="profile"><div className="profile-container">Loading profile...</div></div>;

  return (
    <div className="profile">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar">👤</div>
          <h2 className="profile-name">{profileData.username}</h2>
          <p className="profile-role">Content Creator</p>
          <button className="profile-edit-btn" onClick={() => setIsEditingProfile(true)}>
            Edit Profile
          </button>
        </div>

        <div className="profile-details">
          <h2>Profile Settings</h2>
          {profileSuccess && <div className="success-message">{profileSuccess}</div>}
          {profileError && <div className="error-message">{profileError}</div>}
          <form className="profile-form" onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                placeholder="Enter your username"
                readOnly={!isEditingProfile}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Enter your email"
                readOnly={!isEditingProfile}
              />
            </div>

            {isEditingProfile && (
              <>
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={profileConfirmPassword}
                    onChange={(e) => setProfileConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {isEditingProfile ? (
                <>
                  <button type="submit" className="profile-save-btn">Save Changes</button>
                  <button type="button" className="profile-edit-btn" onClick={() => {
                    setIsEditingProfile(false);
                    setProfilePassword('');
                    setProfileConfirmPassword('');
                    setProfileError('');
                  }}>Cancel</button>
                </>
              ) : (
                <button type="button" className="profile-edit-btn" onClick={() => setIsEditingProfile(true)}>Edit</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;