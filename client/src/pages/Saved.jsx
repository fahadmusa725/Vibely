import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';
import api from '../services/api';
import './Saved.css';

const Saved = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalPost, setActiveModalPost] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchSavedPosts();
  }, [isAuthenticated]);

  const fetchSavedPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/saved');
      if (res.data.success) {
        setSavedPosts(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setSavedPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (!isAuthenticated) {
    return (
      <div className="saved-auth-gate">
        <div className="auth-gate-inner">
          <div className="auth-gate-icon">
            <Lock size={36} />
          </div>
          <h2>Sign in to see your saved posts</h2>
          <p>Your bookmarked posts will appear here after you sign in.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-header">
        <button className="saved-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="saved-title-wrap">
          <Bookmark size={22} className="saved-title-icon" />
          <div>
            <h1 className="saved-title">Saved Posts</h1>
            <p className="saved-subtitle">Only you can see what you've saved</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="saved-skeletons">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card skeleton-post-card">
              <div className="skeleton-post-header">
                <div className="skeleton skeleton-circle" />
                <div className="skeleton-header-text">
                  <div className="skeleton skeleton-username" />
                  <div className="skeleton skeleton-subtitle" />
                </div>
              </div>
              <div className="skeleton skeleton-media-box" />
            </div>
          ))}
        </div>
      ) : savedPosts.length > 0 ? (
        <div className="saved-posts-list">
          {savedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onOpenPostModal={(p) => setActiveModalPost(p)}
            />
          ))}
        </div>
      ) : (
        <div className="saved-empty card">
          <div className="saved-empty-icon">
            <Bookmark size={40} strokeWidth={1.5} />
          </div>
          <h3>No saved posts yet</h3>
          <p>
            Tap the bookmark icon on any post to save it here for later.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Browse Your Feed
          </button>
        </div>
      )}

      {activeModalPost && (
        <PostDetailModal
          post={activeModalPost}
          isOpen={!!activeModalPost}
          onClose={() => setActiveModalPost(null)}
          onPostUpdated={(updated) => {
            setSavedPosts((prev) =>
              prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
            );
          }}
        />
      )}
    </div>
  );
};

export default Saved;
