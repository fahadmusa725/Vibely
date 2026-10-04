import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faLock } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
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
            <FontAwesomeIcon icon={faLock} style={{ fontSize: 36 }} />
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
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 20 }} />
        </button>
        <div className="saved-title-wrap">
          <FontAwesomeIcon icon={farBookmark} style={{ fontSize: 22 }} className="saved-title-icon" />
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
            <FontAwesomeIcon icon={farBookmark} style={{ fontSize: 40 }} />
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
