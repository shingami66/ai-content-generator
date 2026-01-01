import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import '../AI.css';
import { useAppContext } from '../context/AppContext';
import { contentAPI } from '../api/api';
import LoadingOverlay from '../components/LoadingOverlay';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user, setUser, generatedContent, setGeneratedContent, isGenerating, setIsGenerating, canGenerate, incrementGeneration, refreshGenerationCount } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [imageDesc, setImageDesc] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Download image function
  const handleDownload = (content: any) => {
    const link = document.createElement('a');
    link.href = content.url;
    link.download = `ai-generated-${content.type}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open image in modal
  const openImageModal = (content: any) => {
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
    if (!desc) return;

    // Check if user is logged in
    if (!user || !user.id) {
      console.error('❌ User not logged in!');
      alert('Please login first!');
      return;
    }

    console.log('🎨 Starting generation...', { type, desc, userId: user.id });

    // Check generation limit from backend
    console.log('🔍 Checking if can generate...');
    const allowed = await canGenerate();
    console.log('✅ Can generate?', allowed);
    
    if (!allowed) {
      console.log('❌ Limit reached! Showing modal');
      setShowLimitModal(true);
      return;
    }

    setIsGenerating(true);
    console.log('⏳ Generating content with OpenAI...');

    try {
      // Call the real OpenAI API
      const response = await contentAPI.generateContent(user.id, type, desc);
      console.log('✅ Content generated!', response);

      const newContent = {
        id: response.contentId || Date.now(),
        type,
        description: desc,
        url: response.url,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedContent((prev: any[]) => [newContent, ...prev]);
      
      console.log('📊 Incrementing generation count...');
      await incrementGeneration(type);
      
      // Refresh and update generation count
      const countInfo = await refreshGenerationCount();
      setUser({
        ...user,
        generationsToday: countInfo.count,
        generationsLimit: countInfo.limit
      });
      
      console.log('✅ Generation complete!');
      
      setShowResults(true);
      if (type === 'image') setImageDesc('');
      else setVideoDesc('');
    } catch (error: any) {
      console.error('❌ Failed to generate content:', error);
      alert(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard">
      {isGenerating && <LoadingOverlay />}
      {/* Hero Section */}
      <section className="hero">
        <h1>
          <span className="bold">Create Stunning</span>{' '}
          <span className="highlight">AI Content</span>
        </h1>
        <p className="subtitle">
          Transform your ideas into beautiful images and videos using cutting-edge AI technology.
        </p>
        {/* Generation Counter */}
        {user && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: user.subscriptionType === 'premium' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            display: 'inline-block',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {user.subscriptionType === 'premium' ? (
              <span>⭐ Premium: Unlimited Generations</span>
            ) : (
              <span>
                🎨 Generations Today: {user.generationsToday || 0}/{user.generationsLimit || 5}
                {(user.generationsToday || 0) >= (user.generationsLimit || 5) && (
                  <span style={{ marginLeft: '0.5rem', color: '#ff6b6b' }}>❌ Limit Reached</span>
                )}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Tab Buttons */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Generate Images
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Generate Videos
        </button>
      </div>

      {/* Main Content Area */}
      <section className="dashboard-content">
        <div className="dashboard-main">
          <div className="dashboard-form">
            <label className="dashboard-label">
              {activeTab === 'images' 
                ? 'Describe the image you want to create...' 
                : 'Describe the video you want to create...'}
            </label>
            <textarea
              className="dashboard-textarea"
              value={activeTab === 'images' ? imageDesc : videoDesc}
              onChange={(e) => activeTab === 'images' ? setImageDesc(e.target.value) : setVideoDesc(e.target.value)}
              placeholder={activeTab === 'images' 
                ? 'e.g., A serene mountain landscape at sunset with purple clouds' 
                : 'e.g., A time-lapse of city lights at night with moving traffic'}
            />

            <div className="dashboard-dropdowns">
              {activeTab === 'images' ? (
                <>
                  <select className="dashboard-select">
                    <option>Square (1024x1024)</option>
                    <option>Portrait (1024x1536)</option>
                    <option>Landscape (1536x1024)</option>
                  </select>
                  <select className="dashboard-select">
                    <option>Standard</option>
                    <option>High</option>
                    <option>Ultra</option>
                  </select>
                </>
              ) : (
                <>
                  <select className="dashboard-select">
                    <option>5 seconds</option>
                    <option>10 seconds</option>
                    <option>20 seconds</option>
                  </select>
                  <select className="dashboard-select">
                    <option>720p</option>
                    <option>1080p</option>
                    <option>4K</option>
                  </select>
                </>
              )}
            </div>

            <button
              className="dashboard-generate-btn"
              onClick={() => handleGenerate(activeTab === 'images' ? 'image' : 'video')}
              disabled={isGenerating || (activeTab === 'images' ? !imageDesc.trim() : !videoDesc.trim())}
            >
              {isGenerating ? 'Generating...' : 'Generate for free'}
            </button>
          </div>

          <div className="dashboard-tips">
            <h3>💡 {activeTab === 'images' ? 'Image' : 'Video'} Generation Tips</h3>
            <ul>
              {activeTab === 'images' ? (
                <>
                  <li>Be specific about colors, lighting, and composition</li>
                  <li>Include art style preferences</li>
                  <li>Mention camera angles or perspectives</li>
                  <li>Add mood or atmosphere descriptions</li>
                  <li>Try different style presets for unique looks</li>
                </>
              ) : (
                <>
                  <li>Describe motion and movement clearly</li>
                  <li>Specify camera movements</li>
                  <li>Include timing references</li>
                  <li>Mention lighting changes or effects</li>
                  <li>Keep scenes simple for better results</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {showResults && generatedContent.length > 0 && (
        <section className="results-section">
          <div className="results-header">
            <h2>Generated Content ({generatedContent.length})</h2>
            <button className="close-results-btn" onClick={() => setShowResults(false)}>✕</button>
          </div>
          <div className="results-grid">
            {generatedContent.map((c: any) => (
              <div key={c.id} className="content-item" style={{ position: 'relative' }}>
                {c.type === 'image' ? (
                  <>
                    <img 
                      src={c.url} 
                      alt={c.description}
                      onClick={() => openImageModal(c)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <button
                      onClick={() => handleDownload(c)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.9)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                      💾 Download
                    </button>
                  </>
                ) : (
                  <>
                    <video src={c.url} controls />
                    <button
                      onClick={() => handleDownload(c)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      💾 Download
                    </button>
                  </>
                )}
                <p style={{ 
                  marginTop: '10px', 
                  fontSize: '0.9rem', 
                  color: '#ccc',
                  lineHeight: '1.4'
                }}>
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image Preview Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="payment-overlay" 
          onClick={() => setShowImageModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div 
            className="payment-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '90vh',
              padding: '1rem',
              background: 'rgba(20, 20, 30, 0.98)',
              borderRadius: '16px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
              
              <img 
                src={selectedImage.url} 
                alt={selectedImage.description}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 'calc(90vh - 150px)',
                  objectFit: 'contain',
                  borderRadius: '12px'
                }}
              />
              
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px'
              }}>
                <p style={{ 
                  color: '#ccc', 
                  marginBottom: '1rem',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {selectedImage.description}
                </p>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    💾 Download Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="payment-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>Daily Limit Reached!</h2>
              <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                You have used all <strong>5 free generations</strong> for today.
                <br />
                Upgrade to Premium for <strong>unlimited generations</strong>!
              </p>
              
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginBottom: '1rem', color: '#ffd700' }}>✨ Premium Benefits</h3>
                <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>
                    <span>Unlimited image generation</span>
                  </li>
                  <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>
                    <span>Unlimited video creation</span>
                  </li>
                  <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>
                    <span>Priority processing</span>
                  </li>
                  <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>
                    <span>4K quality exports</span>
                  </li>
                </ul>
              </div>

              <button 
                className="subscribe-btn" 
                onClick={() => {
                  setShowLimitModal(false);
                  navigate('/subscription');
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                🚀 Upgrade to Premium - $10/month
              </button>
              
              <button 
                className="payment-cancel"
                onClick={() => setShowLimitModal(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ccc',
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;