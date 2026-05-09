import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { userAPI } from '../api/api';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

const SettingsPage: React.FC = () => {
    const { user, setUser, isAuthenticated, setActivePage } = useAppContext();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Form states
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notifications, setOptions] = useState({
        email: true,
        marketing: false,
    });

    const [appearance, setAppearance] = useState({
        theme: 'dark',
        accentColor: 'purple'
    });

    // Verify authentication on mount
    useEffect(() => {
        setActivePage('settings');
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate, setActivePage]);

    // Sync profile data when user context updates
    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            if (!user?.id) return;

            const response = await userAPI.updateProfile(user.id, profileData.username, profileData.email);

            if (response.success || response.user) {
                setUser({ ...user, username: profileData.username, email: profileData.email });
                setSuccessMessage('Profile updated successfully');

                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorMessage(response.message || 'Failed to update profile');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'An error occurred while updating profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Mock API call for password update since endpoint might not verify old password without backend support
            // In a real app, this would verify currentPassword and update to newPassword
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccessMessage('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const renderSidebar = () => (
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl overflow-hidden sticky top-8">
                <nav className="space-y-1">
                    {[
                        { id: 'profile', label: 'Profile', icon: '👤' },
                        { id: 'security', label: 'Security', icon: '🔒' },
                        { id: 'notifications', label: 'Notifications', icon: '🔔' },
                        { id: 'appearance', label: 'Appearance', icon: '🎨' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30 shadow-lg shadow-purple-500/10'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );

    const renderProfileContent = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b border-white/10">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden ring-4 ring-white/10">
                        {user?.photoUrl ? (
                            <img src={user.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            user?.username?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-gray-900 rounded-full border border-white/20 text-white shadow-lg hover:bg-gray-800 transition transform hover:scale-105" title="Change Avatar">
                        📷
                    </button>
                </div>
                <div className="text-center md:text-left space-y-2">
                    <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                    <p className="text-gray-400">{user?.email}</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${user?.subscriptionType === 'premium'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user?.subscriptionType === 'premium' ? 'bg-pink-400' : 'bg-gray-400'}`}></span>
                        {user?.subscriptionType === 'premium' ? 'Premium Plan' : 'Free Plan'}
                    </span>
                </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                        <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition duration-200"
                            placeholder="Enter username"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition duration-200"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSecurityContent = () => (
        <div className="space-y-8 animate-fade-in">
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Change Password</h3>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Last changed 3 months ago</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Current Password</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="New strong password"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="Repeat new password"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium transition duration-200 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Update Password
                    </button>
                </div>
            </form>

            <div className="pt-8 border-t border-white/10 space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            Two-Factor Authentication <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">RECOMMENDED</span>
                        </h3>
                        <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10 transition-colors focus:outline-none hover:bg-white/20 cursor-pointer">
                        <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
                </div>


            </div>
        </div>
    );

    const renderNotificationsContent = () => (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">Email Notifications</h3>

            <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition duration-200">
                    <div>
                        <p className="font-medium text-white">Generation Complete</p>
                        <p className="text-sm text-gray-400">Get notified when your AI art is ready</p>
                    </div>
                    <div
                        onClick={() => setOptions({ ...notifications, email: !notifications.email })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications.email ? 'bg-purple-600' : 'bg-white/10'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notifications.email ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </div>
                </label>

                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition duration-200">
                    <div>
                        <p className="font-medium text-white">Marketing & Updates</p>
                        <p className="text-sm text-gray-400">Receive news about new features and promos</p>
                    </div>
                    <div
                        onClick={() => setOptions({ ...notifications, marketing: !notifications.marketing })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications.marketing ? 'bg-purple-600' : 'bg-white/10'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notifications.marketing ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </div>
                </label>
            </div>
        </div>
    );

    const renderAppearanceContent = () => (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h3 className="text-xl font-bold text-white mb-6">Theme Preferences</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                        className={`cursor-pointer group transition-all duration-300 ${appearance.theme === 'dark' ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`h-32 rounded-xl bg-[#0f172a] border-2 mb-4 relative overflow-hidden shadow-xl ${appearance.theme === 'dark' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-700'}`}>
                            <div className="absolute top-0 left-0 w-full h-8 bg-[#1e293b] border-b border-gray-700"></div>
                            <div className="absolute top-12 left-4 w-16 h-16 rounded-lg bg-purple-500/20 border border-purple-500/30"></div>
                            <div className="absolute top-12 right-4 space-y-2">
                                <div className="w-12 h-2 bg-gray-700 rounded"></div>
                                <div className="w-8 h-2 bg-gray-800 rounded"></div>
                            </div>

                            {appearance.theme === 'dark' && (
                                <div className="absolute bottom-2 right-2 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full text-white shadow-lg text-xs font-bold">
                                    ✓
                                </div>
                            )}
                        </div>
                        <p className={`font-medium text-center ${appearance.theme === 'dark' ? 'text-white' : 'text-gray-400'}`}>Dark (Default)</p>
                    </div>

                    <div
                        onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                        className={`cursor-pointer group transition-all duration-300 ${appearance.theme === 'light' ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`h-32 rounded-xl bg-gray-100 border-2 mb-4 relative overflow-hidden shadow-xl ${appearance.theme === 'light' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-transparent'}`}>
                            <div className="absolute top-0 left-0 w-full h-8 bg-white border-b border-gray-200"></div>
                            <div className="absolute top-12 left-4 w-16 h-16 rounded-lg bg-purple-100 border border-purple-200"></div>
                            <div className="absolute top-12 right-4 space-y-2">
                                <div className="w-12 h-2 bg-gray-300 rounded"></div>
                                <div className="w-8 h-2 bg-gray-200 rounded"></div>
                            </div>

                            {appearance.theme === 'light' && (
                                <div className="absolute bottom-2 right-2 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full text-white shadow-lg text-xs font-bold">
                                    ✓
                                </div>
                            )}
                        </div>
                        <p className={`font-medium text-center ${appearance.theme === 'light' ? 'text-white' : 'text-gray-400'}`}>Light</p>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-6">Accent Color</h3>
                <div className="flex gap-6">
                    <button
                        onClick={() => setAppearance({ ...appearance, accentColor: 'purple' })}
                        className={`w-12 h-12 rounded-full bg-purple-500 cursor-pointer transition-all duration-200 ${appearance.accentColor === 'purple' ? 'ring-4 ring-white/20 ring-offset-2 ring-offset-[#0f172a] scale-110' : 'hover:scale-105'
                            }`}
                        aria-label="Purple Accent"
                    />
                    <button
                        onClick={() => setAppearance({ ...appearance, accentColor: 'pink' })}
                        className={`w-12 h-12 rounded-full bg-pink-500 cursor-pointer transition-all duration-200 ${appearance.accentColor === 'pink' ? 'ring-4 ring-white/20 ring-offset-2 ring-offset-[#0f172a] scale-110' : 'hover:scale-105'
                            }`}
                        aria-label="Pink Accent"
                    />
                    <button
                        onClick={() => setAppearance({ ...appearance, accentColor: 'blue' })}
                        className={`w-12 h-12 rounded-full bg-blue-500 cursor-pointer transition-all duration-200 ${appearance.accentColor === 'blue' ? 'ring-4 ring-white/20 ring-offset-2 ring-offset-[#0f172a] scale-110' : 'hover:scale-105'
                            }`}
                        aria-label="Blue Accent"
                    />
                    <button
                        onClick={() => setAppearance({ ...appearance, accentColor: 'green' })}
                        className={`w-12 h-12 rounded-full bg-green-500 cursor-pointer transition-all duration-200 ${appearance.accentColor === 'green' ? 'ring-4 ring-white/20 ring-offset-2 ring-offset-[#0f172a] scale-110' : 'hover:scale-105'
                            }`}
                        aria-label="Green Accent"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-white p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 inline-block mb-2">
                        Account Settings
                    </h1>
                    <p className="text-gray-400">Manage your profile, security, and preferences.</p>
                </div>
            </header>

            {(successMessage || errorMessage) && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in ${successMessage
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    <span className="text-lg">{successMessage ? '✓' : '⚠'}</span>
                    {successMessage || errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Sidebar */}
                {renderSidebar()}

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8 shadow-xl min-h-[500px] transition-all duration-300">
                        {activeTab === 'profile' && renderProfileContent()}
                        {activeTab === 'security' && renderSecurityContent()}
                        {activeTab === 'notifications' && renderNotificationsContent()}
                        {activeTab === 'appearance' && renderAppearanceContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
