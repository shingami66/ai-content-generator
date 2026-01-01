// src/pages/GalleryPage.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { contentAPI } from '../api/api';
import '../AI.css';

const GalleryPage: React.FC = () => {
  const { isAuthenticated, setActivePage, generatedContent, setGeneratedContent, user } = useAppContext();
  const [galleryTab, setGalleryTab] = useState<'my-content' | 'community'>('my-content');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load user content from database
  useEffect(() => {
    const loadUserContent = async () => {
      if (!user || !user.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/content/user/${user.id}`);
        const data = await response.json();
        
        if (data.success && data.content) {
          // Transform database content to ContentItem format
          const transformedContent = data.content.map((item: any) => ({
            id: item.ContentID,
            type: item.ContentType,
            description: item.Description || item.Title,
            url: item.URL || 'https://placehold.co/400x300/667eea/ffffff?text=No+Image',
            timestamp: item.DateCreated
          }));
          
          setGeneratedContent(transformedContent);
          console.log('✅ Loaded', transformedContent.length, 'items from database');
        }
      } catch (error) {
        console.error('❌ Error loading content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserContent();
  }, [user?.id]);

  useEffect(() => {
    setActivePage('gallery');
  }, [setActivePage]);

  // Filter content by search query
  const myContent = generatedContent.filter(item => 
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open image in modal
  const openImageModal = (item: any) => {
    setSelectedImage(item);
    setShowImageModal(true);
  };

  // Download image function
  const handleDownload = (item: any) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `ai-generated-${item.type}-${item.id || Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete content function
  const handleDelete = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setDeletingId(item.id);
    try {
      const response = await contentAPI.deleteContent(item.id);
      if (response.success) {
        // Remove from local state
        setGeneratedContent((prev: any[]) => prev.filter((c: any) => c.id !== item.id));
        
        // Close modal if the deleted item is currently open
        if (selectedImage && selectedImage.id === item.id) {
          setShowImageModal(false);
          setSelectedImage(null);
        }
        
        console.log('✅ Content deleted successfully');
      } else {
        alert('Failed to delete content. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting content:', error);
      alert('An error occurred while deleting content. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="gallery">
      <section className="gallery-header">
        <h1>Content Gallery</h1>
        <p>Explore and manage your AI-generated content</p>
      </section>

      <section className="gallery-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search your content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="gallery-actions">
          <button className="filter-btn">📅 Newest First ▾</button>
          <button 
            className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
            onClick={() => setLayout('grid')}
          >
            ▦
          </button>
          <button 
            className={`layout-btn ${layout === 'list' ? 'active' : ''}`}
            onClick={() => setLayout('list')}
          >
            ☰
          </button>
        </div>
      </section>

      <section className="gallery-tabs">
        <button 
          className={`tab ${galleryTab === 'my-content' ? 'active' : ''}`}
          onClick={() => setGalleryTab('my-content')}
        >
          My Content ({myContent.length})
        </button>
        <button 
          className={`tab ${galleryTab === 'community' ? 'active' : ''}`}
          onClick={() => setGalleryTab('community')}
        >
          Community (WIP)
        </button>
      </section>

      <section className={`gallery-content ${layout}`}>
        {isLoading ? (
          <div className="gallery-empty">
            <div style={{ fontSize: '4rem', margin: '2rem 0' }}>⌛</div>
            <p>Loading your content...</p>
          </div>
        ) : galleryTab === 'my-content' && myContent.length > 0 ? (
          myContent.map(item => (
            <div key={item.id} className="content-item" style={{ position: 'relative' }}>
              {item.type === 'image' ? (
                <>
                  <img 
                    src={item.url} 
                    alt={item.description}
                    onClick={() => openImageModal(item)}
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s',
                      width: '100%',
                      height: 'auto'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      style={{
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      disabled={deletingId === item.id}
                      style={{
                        background: deletingId === item.id ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.7)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== item.id) {
                          e.currentTarget.style.background = 'rgba(255,0,0,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deletingId !== item.id) {
                          e.currentTarget.style.background = 'rgba(255,0,0,0.7)';
                        }
                      }}
                    >
                      {deletingId === item.id ? '⏳' : '🗑️'} {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <video src={item.url} controls />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      style={{
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      disabled={deletingId === item.id}
                      style={{
                        background: deletingId === item.id ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.7)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      {deletingId === item.id ? '⏳' : '🗑️'} {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
              <div className="content-info">
                <p>{item.description}</p>
                <span className="timestamp">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="gallery-empty">
            <h2>Your Creations ({myContent.length})</h2>
            <div className="empty-content">
              <div style={{ fontSize: '4rem', margin: '2rem 0' }}>📷</div>
              <p>Start creating your first AI-generated content!</p>
            </div>
          </div>
        )}
      </section>

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
                  <button
                    onClick={() => {
                      handleDelete(selectedImage);
                    }}
                    disabled={deletingId === selectedImage.id}
                    style={{
                      padding: '12px 24px',
                      background: deletingId === selectedImage.id 
                        ? 'rgba(255,0,0,0.5)' 
                        : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: deletingId === selectedImage.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (deletingId !== selectedImage.id) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deletingId !== selectedImage.id) {
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {deletingId === selectedImage.id ? '⏳ Deleting...' : '🗑️ Delete from Gallery'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
