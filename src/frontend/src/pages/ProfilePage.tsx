import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { contentAPI } from '../api/api';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setActivePage } = useAppContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGenerations: 0,
    images: 0,
    videos: 0,
    likes: 0
  });
  // const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    setActivePage('profile');
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, setActivePage]);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      try {
        const response = await contentAPI.getUserContent(user.id);
        if (response.success && response.content) {
          const content = response.content;
          setStats({
            totalGenerations: content.length,
            images: content.filter((c: any) => !c.contentType || c.contentType === 'image').length,
            videos: content.filter((c: any) => c.contentType === 'video').length,
            likes: 0 // Mocking likes as it's not in the API yet
          });

          // Get 3 most recent items
          // setRecentActivity(content.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to load stats');
      }
    };

    loadStats();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen text-white p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <header className="text-center md:text-left mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 inline-block">
          My Profile
        </h1>
      </header>

      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Gradient Blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500">
              <div className="w-full h-full rounded-full bg-black/50 overflow-hidden flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0f172a]" title="Online"></div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
            <p className="text-gray-400 mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${user.subscriptionType === 'premium' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                }`}>
                {user.subscriptionType === 'premium' ? 'Premium Member' : 'Free Tier'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Member since 2023
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[160px]">
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition flex items-center justify-center gap-2"
            >
              <span>⚙️</span> Edit Profile
            </button>
            {user.subscriptionType !== 'premium' && (
              <button
                onClick={() => navigate('/subscription')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:scale-105 transition shadow-lg shadow-purple-500/20 animate-pulse-slow"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalGenerations}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Creations</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
            <div className="text-2xl font-bold text-pink-400 mb-1">{stats.images}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Images</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
            <div className="text-2xl font-bold text-purple-400 mb-1">{stats.videos}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Videos</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{user.generationsRemaining || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Credits Left</div>
          </div>
        </div>
      </div>

      {/* Account Danger Zone */}
      <div className="bg-red-500/5 backdrop-blur-md border border-red-500/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-gray-300 font-medium">Delete Account</p>
            <p className="text-sm text-gray-500">Permanently delete your account and all generated content.</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                alert('Please contact support to delete your account.');
              }
            }}
            className="px-6 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;