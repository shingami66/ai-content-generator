import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { contentAPI } from '../api/api';

const GalleryPage: React.FC = () => {
  const { isAuthenticated, setActivePage, generatedContent, setGeneratedContent, user } = useAppContext();
  const [activeTab, setActiveTab] = useState<'my-content' | 'community'>('my-content');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load user content from database
  const loadUserContent = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);
    try {
      const response = await contentAPI.getUserContent(user.id);

      if (response.success && response.content) {
        const transformedContent = response.content.map((item: any) => ({
          id: item._id || item.ContentID,
          type: item.contentType || item.ContentType || 'image',
          description: item.description || item.Description || item.Title || 'AI Generated Content',
          url: item.url || item.URL || 'https://placehold.co/400x300/667eea/ffffff?text=No+Image',
          timestamp: item.dateCreated || item.DateCreated || new Date().toISOString()
        }));

        setGeneratedContent(transformedContent);
      } else {
        setGeneratedContent([]);
      }
    } catch (error: any) {
      console.error('Error loading content:', error);
      setGeneratedContent([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserContent();
  }, [user?.id]);

  useEffect(() => {
    setActivePage('gallery');
  }, [setActivePage]);

  // Filter content
  const filteredContent = generatedContent.filter(item => {
    const matchesSearch = (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDownload = (item: any) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `ai-generated-${item.type}-${item.id || Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    setDeletingId(item.id);
    try {
      const response = await contentAPI.deleteContent(item.id);
      if (response.success) {
        setGeneratedContent((prev) => prev.filter((c) => c.id !== item.id));
        if (selectedImage?.id === item.id) setSelectedImage(null);
      } else {
        alert('Failed to delete content');
      }
    } catch (error) {
      alert('Error deleting content');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen text-white p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 inline-block mb-2">
            Content Gallery
          </h1>
          <p className="text-gray-400">Explore and manage your AI-generated masterpieces.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('my-content')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my-content'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            My Content
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'community'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            Community
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search creations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <select className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer">
            <option>Newest First</option>
            <option>Oldest First</option>
            <option>A-Z</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
          <div className="text-4xl mb-4">⌛</div>
          <p>Loading your masterpiece collection...</p>
        </div>
      ) : activeTab === 'community' ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-bold text-white mb-2">Community Gallery</h3>
          <p className="text-gray-400 text-center max-w-md">
            The community gallery is currently under construction. Check back soon for inspiration from other creators!
          </p>
        </div>
      ) : filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in-up">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-500/20"
            >
              {/* Image/Video Thumbnail */}
              <div
                className="aspect-square w-full cursor-pointer relative"
                onClick={() => setSelectedImage(item)}
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.description}
                    className="w-full h-full object-cover transition duration-300 group-hover:brightness-110"
                    loading="lazy"
                  />
                )}

                {/* Type Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/10">
                  {item.type === 'video' ? '🎥 Video' : '🖼️ Image'}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white text-sm line-clamp-2 font-medium mb-3">
                    {item.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                    >
                      <span>💾</span> Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      disabled={deletingId === item.id}
                      className="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md border border-red-500/30 text-white p-2 rounded-lg transition"
                      title="Delete"
                    >
                      {deletingId === item.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
          <div className="text-6xl mb-6 opacity-80">🎨</div>
          <h3 className="text-xl font-bold text-white mb-2">No Content Found</h3>
          <p className="text-gray-400 text-center max-w-md mb-8">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : "You haven't generated any content yet. Start creating amazing AI art today!"}
          </p>
          {!searchQuery && (
            <a href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition shadow-lg shadow-purple-500/20">
              Create New
            </a>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white text-4xl font-light transition"
            >
              &times;
            </button>

            <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {selectedImage.type === 'video' ? (
                <video src={selectedImage.url} controls autoPlay className="max-w-full max-h-[80vh]" />
              ) : (
                <img src={selectedImage.url} alt={selectedImage.description} className="max-w-full max-h-[80vh] object-contain" />
              )}
            </div>

            <div className="w-full mt-4 flex items-center justify-between bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <p className="text-gray-300 text-sm line-clamp-1 flex-1 mr-4">
                {selectedImage.description}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white text-sm font-semibold hover:scale-105 transition flex items-center gap-2"
                >
                  <span>💾</span> Download
                </button>
                <button
                  onClick={() => handleDelete(selectedImage)}
                  disabled={deletingId === selectedImage.id}
                  className="px-4 py-2 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                  {deletingId === selectedImage.id ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
