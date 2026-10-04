import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faCompass, faFaceSmile, faImage, faLocationDot, faRightToBracket, faUserPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';
import RightSidebar from '../components/RightSidebar';
import StoriesTray from '../components/stories/StoriesTray';
import api from '../services/api';
import './Feed.css';

const LoggedOutLanding = () => {
  const navigate = useNavigate();
  return (
    <div className="logged-out-landing">
      <div className="lol-badge">
        <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 32 }} />
      </div>
      <h2 className="lol-headline">Welcome to Vibely</h2>
      <p className="lol-sub">
        Sign in to see posts from people you follow, discover trending content,
        and share your own moments with the community.
      </p>
      <div className="lol-actions">
        <button
          id="feed-signin-btn"
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          <FontAwesomeIcon icon={faRightToBracket} style={{ fontSize: 16 }} />
          <span>Sign In</span>
        </button>
        <button
          id="feed-join-btn"
          className="btn btn-secondary"
          onClick={() => navigate('/register')}
        >
          <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 16 }} />
          <span>Join Community</span>
        </button>
      </div>
    </div>
  );
};

const Feed = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [activeModalPost, setActiveModalPost] = useState(null);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'friend';

  useEffect(() => {

    if (!isAuthenticated) return;
    fetchFeed(1);
    fetchSuggested();
  }, [isAuthenticated]);

  const fetchFeed = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/posts/feed?page=${pageNum}&limit=10`);
      if (res.data.success) {
        if (pageNum === 1) {
          setPosts(res.data.data);
        } else {
          setPosts((prev) => [...prev, ...res.data.data]);
        }
        setHasMore(res.data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      if (res.data.success) {
        setSuggestedUsers(res.data.data);
      }
    } catch (err) {
      console.error('Suggested users error:', err);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
      fetchFeed(1);
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="app-center-col">
          <LoggedOutLanding />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-center-col">
        <div className="feed-center">
        <StoriesTray />

        <div className="feed-composer card">
          <div className="composer-top-row" onClick={onOpenCreateModal}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt={user?.fullName || 'User'}
              className="composer-user-avatar"
            />
            <div className="composer-pill-input">
              What's on your mind, {firstName}?
            </div>
          </div>

          <div className="composer-divider" />

          <div className="composer-actions-grid">
            <button
              className="composer-action-btn"
              onClick={onOpenCreateModal}
            >
              <FontAwesomeIcon icon={faImage} style={{ fontSize: 18 }} className="c-icon photo-icon" />
              <span>Photo/Video</span>
            </button>

            <button
              className="composer-action-btn"
              onClick={onOpenCreateModal}
            >
              <FontAwesomeIcon icon={faFaceSmile} style={{ fontSize: 18 }} className="c-icon feeling-icon" />
              <span>Feeling</span>
            </button>

            <button
              className="composer-action-btn"
              onClick={onOpenCreateModal}
            >
              <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 18 }} className="c-icon location-icon" />
              <span>Location</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="feed-skeletons">
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
        ) : posts.length > 0 ? (
          <div className="posts-container">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onOpenPostModal={(p) => setActiveModalPost(p)}
              />
            ))}

            {hasMore && (
              <div className="load-more-section">
                <button
                  className="btn btn-secondary"
                  onClick={() => fetchFeed(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 15 }} className="animate-spin" /> Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card feed-empty-state">
            <div className="empty-illustration-badge">
              <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 36, color: 'var(--accent-primary)' }} />
            </div>
            <h3>Your Feed is Ready</h3>
            <p>Follow creators to personalize your feed or share your first post.</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                <FontAwesomeIcon icon={faCompass} style={{ fontSize: 16 }} />
                <span>Discover Creators</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

      <aside className="app-right-sidebar">
        <RightSidebar
          suggestedUsers={suggestedUsers}
          onFollowUser={handleFollowToggle}
        />
      </aside>

      {activeModalPost && (
        <PostDetailModal
          post={activeModalPost}
          isOpen={!!activeModalPost}
          onClose={() => setActiveModalPost(null)}
          onPostUpdated={(updated) => {
            setPosts((prev) =>
              prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
            );
          }}
        />
      )}
    </>
  );
};

export default Feed;
