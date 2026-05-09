import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { subscriptionAPI } from '../api/api';
import toast from 'react-hot-toast';
const DashboardPage: React.FC = () => {
  const { isAuthenticated, user, setUser, generatedContent, isGenerating, refreshGenerationCount, generateContent } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [imageDesc, setImageDesc] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; description: string; type: string } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [validationError, setValidationError] = useState<string>('');
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handlePortalRedirect = async () => {
    if (!user?.id) return;
    setIsPortalLoading(true);
    try {
      const response = await subscriptionAPI.createPortalSession(user.id);
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        toast.error('Failed to open subscription portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('Could not manage subscription');
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Download image function
  const handleDownload = (content: { url: string; type: string; description: string }) => {
    const link = document.createElement('a');
    link.href = content.url;
    link.download = `ai-generated-${content.type}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open image in modal
  const openImageModal = (content: { url: string; type: string; description: string }) => {
    setSelectedImage(content);
    setShowImageModal(true);
  };

  // Refresh generation count when component mounts and update user state
  useEffect(() => {
    const updateCount = async () => {
      if (user && user.id) {
        const countInfo = await refreshGenerationCount();
        setUser({
          ...user,
          generationsToday: countInfo.count,
          generationsLimit: countInfo.limit
        });
      }
    };
    updateCount();
  }, [user?.id]);

  const handleGenerate = async (type: 'image' | 'video') => {
    if (isGenerating) return;

    const desc = (type === 'image' ? imageDesc : videoDesc).trim();

    // Frontend validation
    if (!desc) {
      setValidationError('Please enter a description');
      return;
    }

    if (desc.length < 3) {
      setValidationError('Description must be at least 3 characters long');
      return;
    }

    if (desc.length > 500) {
      setValidationError('Description must be less than 500 characters');
      return;
    }

    // Clear any previous validation errors
    setValidationError('');

    // Check if user is logged in
    if (!user || !user.id) {
      console.error('❌ User not logged in!');
      alert('Please login first!');
      return;
    }

    // Show optional toast/notification here if we had a toast system
    console.log(`⏳ Starting ${type} generation... You can navigate away.`);

    // Show different message for video generation
    if (type === 'video') {
      alert('🎬 Video generation started! This may take 1-5 minutes. You can continue using the app.');
    }

    try {
      // Call Global Context Function - This handles API, State Update, and Credits
      await generateContent(type, desc);

      console.log('✅ Generation complete!');

      setShowResults(true);
      if (type === 'image') setImageDesc('');
      else setVideoDesc('');
    } catch (error: any) {
      console.error('❌ Failed to generate content:', error);
      alert(error.message || 'Failed to generate content. Please try again.');
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col gap-8">
      {/* Non-blocking progress indicator */}
      {isGenerating && (
        <div className="fixed top-20 right-8 z-50 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold">Generating new content...</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="text-center py-12 animate-fade-in-up">
        <h1 className="text-5xl lg:text-7xl font-bold mb-4 tracking-tight text-white drop-shadow-lg">
          Create Stunning <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">AI Content</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          Transform your ideas into beautiful images and videos using cutting-edge AI technology.
        </p>

        {/* Generation Counter Badge */}
        {user && (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-xl transition-transform hover:scale-105">
              {user.subscriptionType === 'premium' || user.subscriptionType === 'pro' ? (
                <>
                  <span className="text-xl text-amber-400">⚡</span>
                  <span className="font-semibold text-white">
                    {user.subscriptionType === 'premium' ? 'Unlimited Generations' : (user.generationsRemaining ?? 0) + ' Credits Remaining'}
                  </span>
                  <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold px-2 py-0.5 rounded-full uppercase">
                    {user.subscriptionType}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl text-yellow-400">⚡</span>
                  <span className="font-semibold text-white">Generations Today: <span className={(user.generationsToday || 0) >= (user.generationsLimit || 5) ? "text-red-400" : "text-white"}>{user.generationsToday || 0}</span>/{user.generationsLimit || 5}</span>
                  {user.subscriptionType !== 'free' && (
                    <span className="ml-2 text-xs bg-gray-700 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                      {user.subscriptionType}
                    </span>
                  )}
                </>
              )}
            </div>
            {user.subscriptionEndDate && user.subscriptionType !== 'free' && (
              <span className="text-xs text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                📅 Renews on: {new Date(user.subscriptionEndDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Tab Controls */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/5 backdrop-blur-lg p-1.5 rounded-full border border-white/10 flex gap-2 shadow-lg">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-8 py-2.5 rounded-full font-semibold transition-all duration-300 ${activeTab === 'images'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            Generate Images
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-8 py-2.5 rounded-full font-semibold transition-all duration-300 ${activeTab === 'videos'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            Generate Videos
          </button>
        </div>
      </div>

      {/* Main Content Area: Grid Layout */}
      <section className="w-full max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generation Form */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <label className="text-lg font-medium text-gray-200 mb-3 block">
                {activeTab === 'images' ? 'Describe the image you want to create...' : 'Describe the video you want to create...'}
              </label>
              <textarea
                className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none shadow-inner"
                value={activeTab === 'images' ? imageDesc : videoDesc}
                onChange={(e) => {
                  activeTab === 'images' ? setImageDesc(e.target.value) : setVideoDesc(e.target.value);
                  setValidationError('');
                }}
                placeholder={activeTab === 'images'
                  ? 'e.g., A serene mountain landscape at sunset with purple clouds and golden light reflections...'
                  : 'e.g., A cinematic drone shot flying over a futuristic city at night...'}
              />
              {validationError && (
                <div className="text-red-400 text-sm mt-2 font-medium">
                  ⚠️ {validationError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {activeTab === 'images' ? (
                <>
                  <div className="relative">
                    <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer hover:bg-white/5 transition">
                      <option>Square (1024x1024)</option>
                      <option>Portrait (1024x1536)</option>
                      <option>Landscape (1536x1024)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                  </div>
                  <div className="relative">
                    <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer hover:bg-white/5 transition">
                      <option>Standard Quality</option>
                      <option>High Quality</option>
                      <option>Ultra Quality</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer hover:bg-white/5 transition">
                      <option>5 seconds</option>
                      <option>10 seconds</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                  </div>
                  <div className="relative">
                    <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer hover:bg-white/5 transition">
                      <option>720p HD</option>
                      <option>1080p FHD</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                  </div>
                </>
              )}
            </div>

            <button
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              onClick={() => handleGenerate(activeTab === 'images' ? 'image' : 'video')}
              disabled={isGenerating || (activeTab === 'images' ? !imageDesc.trim() : !videoDesc.trim())}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Magic...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate for free</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Right Column: Tips */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <span className="text-2xl">💡</span>
            <h3 className="text-xl font-bold text-white">Generation Tips</h3>
          </div>

          <ul className="space-y-4">
            {activeTab === 'images' ? (
              <>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-blue-400 text-lg">•</span>
                  <span>Be specific about <strong>lighting</strong> (e.g., golden hour, cinematic lighting).</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-purple-400 text-lg">•</span>
                  <span>Mention an <strong>art style</strong> like "oil painting", "cyberpunk", or "realistic".</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-pink-400 text-lg">•</span>
                  <span>Describe the <strong>mood</strong> (mysterious, cheerful, gloomy).</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-yellow-400 text-lg">•</span>
                  <span>Try separate keywords with commas for better clarity.</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-blue-400 text-lg">•</span>
                  <span>Keep descriptions <strong>short and simple</strong> for videos.</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-purple-400 text-lg">•</span>
                  <span>Focus on <strong>movement</strong> (e.g., "clouds moving", "person walking").</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-pink-400 text-lg">•</span>
                  <span>Avoid complex interactions between multiple objects.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </section>

      {/* Results Section */}
      {showResults && generatedContent.length > 0 && (
        <section className="w-full max-w-6xl mx-auto px-4 mt-8 animate-fade-in-up">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Generations</h2>
              <button onClick={() => setShowResults(false)} className="text-gray-400 hover:text-white transition">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedContent.slice(0, 3).map((c) => (
                <div key={c.id} className="relative group rounded-xl overflow-hidden border border-white/10">
                  {c.type === 'image' ? (
                    <img
                      src={c.url}
                      alt={c.description}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                      onClick={() => openImageModal(c)}
                    />
                  ) : (
                    <video src={c.url} controls className="w-full h-64 object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-sm line-clamp-2 mb-3">{c.description}</p>
                    <button
                      onClick={() => handleDownload(c)}
                      className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-medium backdrop-blur-sm transition"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-5xl w-full bg-[#1e1e28] rounded-2xl overflow-hidden border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition">✕</button>

            <div className="grid grid-cols-1 lg:grid-cols-3 h-[80vh]">
              <div className="lg:col-span-2 bg-black flex items-center justify-center p-4">
                <img src={selectedImage.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
              <div className="lg:col-span-1 p-8 flex flex-col bg-[#1e1e28]">
                <h3 className="text-xl font-bold text-white mb-4">Details</h3>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-300 leading-relaxed text-sm mb-6">{selectedImage.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <span className="block text-gray-500 mb-1">Type</span>
                      <span className="text-white capitalize">{selectedImage.type}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Date</span>
                      <span className="text-white">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 mt-4"
                >
                  <span>⬇️</span> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e28] border border-white/10 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl animate-fade-in-up">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-gray-400 mb-6">You've used all your free generations for today. Upgrade to create without limits!</p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-green-400">✓</span> Unlimited Images & Videos
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-green-400">✓</span> Higher Quality Exports
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-green-400">✓</span> Priority Processing
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setShowLimitModal(false); navigate('/subscription'); }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/25 transition"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-medium transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manage Subscription Shortcut */}
      {(user?.subscriptionType === 'pro' || user?.subscriptionType === 'premium') && (
        <div className="flex justify-center -mt-8 mb-8 animate-fade-in-up delay-100">
          <button
            disabled={isPortalLoading}
            onClick={handlePortalRedirect}
            className={`text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors ${isPortalLoading ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            {isPortalLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Opening Portal...</span>
              </>
            ) : (
              <>
                <span>⚙️ Manage {user.subscriptionType} Subscription</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;