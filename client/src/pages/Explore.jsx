import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faComment, faCompass, faHeart, faLayerGroup, faXmark } from '@fortawesome/free-solid-svg-icons';
import PostDetailModal from '../components/PostDetailModal';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Explore.css';

const Explore = () => {
  const { updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTag = searchParams.get('tag') || '';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    fetchExplorePosts(1);
    fetchSuggested();
  }, [activeTag]);

  const fetchExplorePosts = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : '';
      const res = await api.get(`/posts/discover?page=${pageNum}&limit=18${tagParam}`);
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
      console.error('Explore error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      if (res.data.success) setSuggestedUsers(res.data.data);
    } catch (err) {
      console.error('Suggested users error:', err);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      updateUser({ followingCount: res.data.followingCount });
      setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  return (
    <>
      <div className="app-center-col">
        <div className="explore-center">
        <div className="explore-header">
          <div className="explore-badge">
            <FontAwesomeIcon icon={faCompass} style={{ fontSize: 18 }} />
            <span>Discover</span>
          </div>
          <h2>Find something new</h2>
          <p>Photos and stories from creators across Vibely, all in one place.</p>
          {activeTag && (
            <div className="explore-tag-chip">
              <span>#{activeTag}</span>
              <button
                className="explore-tag-chip-clear"
                onClick={() => navigate('/explore')}
                aria-label="Clear tag filter"
              >
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 13 }} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="explore-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="explore-grid-item skeleton" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="explore-grid">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="explore-grid-item"
                  onClick={() => setActiveModalPost(post)}
                >
                  <img
                    src={post.images?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'}
                    alt={post.caption || 'Explore post'}
                    loading="lazy"
                  />

                  {post.images && post.images.length > 1 && (
                    <div className="carousel-indicator">
                      <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: 16 }} />
                    </div>
                  )}

                  <div className="explore-overlay">
                    <div className="overlay-stat">
                      <FontAwesomeIcon icon={faHeart} style={{ fontSize: 20, color: '#ffffff' }} />
                      <span>{post.likesCount || post.likes?.length || 0}</span>
                    </div>
                    <div className="overlay-stat">
                      <FontAwesomeIcon icon={faComment} style={{ fontSize: 20, color: '#ffffff' }} />
                      <span>{post.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="explore-load-more">
                <button
                  className="btn btn-secondary"
                  onClick={() => fetchExplorePosts(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 16 }} className="animate-spin" /> Loading...
                    </>
                  ) : (
                    'Discover More'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card explore-empty">
            <FontAwesomeIcon icon={faCompass} style={{ fontSize: 40 }} className="empty-icon" />
            <h3>No posts found yet</h3>
            <p>Be the very first creator to share a moment on Vibely!</p>
          </div>
        )}

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
      </div>
    </div>

      <aside className="app-right-sidebar">
        <RightSidebar
          suggestedUsers={suggestedUsers}
          onFollowUser={handleFollowToggle}
        />
      </aside>
    </>
  );
};

export default Explore;
