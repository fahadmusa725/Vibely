import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faCheck, faChevronLeft, faChevronRight, faEllipsis, faHeart, faPen, faShareNodes, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark, faComment as farComment, faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from './VerifiedBadge';
import { formatRelativeTime, formatFullDateTooltip } from '../utils/formatTime';
import api from '../services/api';
import './PostCard.css';

const renderCaption = (text, navigate) => {
  if (!text) return null;
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      const tag = part.slice(1).toLowerCase();
      return (
        <span
          key={i}
          className="caption-hashtag"
          onClick={(e) => { e.stopPropagation(); navigate(`/explore?tag=${encodeURIComponent(tag)}`); }}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};


const PostCard = ({ post: initialPost, onPostDeleted, onPostUpdated, onOpenPostModal }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(initialPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const commentsCount = post.commentsCount || 0;
  const [isSaved, setIsSaved] = useState(initialPost.isSaved || false);
  const [showOptions, setShowOptions] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const dropdownRef = useRef(null);

  const isAuthor = user && post.author && (user._id === post.author._id || user._id === post.author);
  const images = post.images && post.images.length > 0 ? post.images : [];

  useEffect(() => {
    setPost(initialPost);
    setIsLiked(initialPost.isLiked || false);
    setLikesCount(initialPost.likesCount || 0);
    setIsSaved(initialPost.isSaved || false);
  }, [initialPost]);

  useEffect(() => {
    if (!showOptions) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleImageDoubleTap = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isLiked) {
      handleLikeToggle();
      return;
    }
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 800);
  };

  const handleLikeToggle = async (e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextState = !isLiked;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (nextState) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 800);
    }

    try {
      await api.post(`/posts/${post._id}/like`);
      if (onPostUpdated) onPostUpdated({ ...post, isLiked: nextState, likesCount: nextCount, isSaved });
    } catch (error) {
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleSaveToggle = async (e) => {
    if (e) e.stopPropagation();
    setShowOptions(false);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);

    try {
      const res = await api.post(`/posts/${post._id}/save`);
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
        if (onPostUpdated) onPostUpdated({ ...post, isLiked, likesCount, isSaved: res.data.isSaved });
      }
    } catch (error) {
      console.error('Save toggle error:', error);
      setIsSaved(!nextState);
    }
  };

  const handleDelete = async () => {
    setShowOptions(false);
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        if (onPostDeleted) {
          onPostDeleted(post._id);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  const openPostModal = () => {
    if (onOpenPostModal) {
      onOpenPostModal({ ...post, isLiked, likesCount, isSaved });
    } else {
      navigate(`/post/${post._id}`);
    }
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
    }
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const openEditModal = () => {
    setShowOptions(false);
    setEditCaption(post.caption || '');
    setEditLocation(post.location || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const formData = new FormData();
      formData.append('caption', editCaption);
      formData.append('location', editLocation);

      const res = await api.patch(`/posts/${post._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const updated = res.data.data;
        setPost((prev) => ({ ...prev, ...updated }));
        if (onPostUpdated) onPostUpdated({ ...post, ...updated });
        setShowEditModal(false);
      } else {
        setEditError(res.data.message || 'Failed to update post.');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error updating post.');
    } finally {
      setEditLoading(false);
    }
  };

  const timeLocation = [
    formatRelativeTime(post.createdAt),
    post.location ? post.location : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <>
      <article className="post-card card">
        {toastMessage && (
          <div className="postcard-toast">
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 16 }} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="post-header-section">
          <div
            className="post-author-block"
            onClick={() => navigate(`/profile/${post.author?.username}`)}
          >
            <img
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt={post.author?.username || 'User'}
              className="post-author-avatar"
            />
            <div className="post-author-meta">
              <div className="author-name-row">
                <span className="author-name-text">
                  {post.author?.fullName || post.author?.username || 'Creator'}
                </span>
                {post.author?.isVerified && <VerifiedBadge size={14} />}
              </div>
              <span
                className="post-subtitle"
                title={formatFullDateTooltip(post.createdAt)}
              >
                {timeLocation}
              </span>
            </div>
          </div>

          <div className="post-options-wrap" ref={dropdownRef}>
            <button
              className="icon-btn-ghost"
              onClick={() => setShowOptions((prev) => !prev)}
              aria-label="Post options"
            >
              <FontAwesomeIcon icon={faEllipsis} style={{ fontSize: 19 }} />
            </button>

            {showOptions && (
              <div className="post-options-dropdown">
                <button className="dropdown-item" onClick={handleSaveToggle}>
                  <FontAwesomeIcon icon={isSaved ? faBookmark : farBookmark} style={{ fontSize: 15 }} />
                  <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                </button>

                {isAuthor && (
                  <>
                    <button className="dropdown-item" onClick={openEditModal}>
                      <FontAwesomeIcon icon={faPen} style={{ fontSize: 15 }} />
                      <span>Edit Post</span>
                    </button>
                    <button className="dropdown-item danger" onClick={handleDelete}>
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: 15 }} />
                      <span>Delete Post</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {post.caption && (
          <div className="post-caption-section">
            <p className="post-caption-text">{renderCaption(post.caption, navigate)}</p>
          </div>
        )}

        {images.length > 0 && (
          <div
            className="post-media-container"
            onDoubleClick={handleImageDoubleTap}
          >
            <div
              className="post-media-bg"
              style={{ backgroundImage: `url(${images[currentImageIndex]?.url})` }}
            />

            <img
              src={images[currentImageIndex]?.url}
              alt="Post media"
              className="post-image-content"
              loading="lazy"
            />

            {images.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={handlePrevImage} aria-label="Previous image">
                  <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
                </button>
                <button className="carousel-btn next" onClick={handleNextImage} aria-label="Next image">
                  <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 18 }} />
                </button>
                <div className="carousel-dots">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </>
            )}

            {likeAnimating && (
              <div className="heart-pulse-overlay">
                <FontAwesomeIcon icon={faHeart} style={{ fontSize: 88, color: '#ed4956' }} className="animated-heart" />
              </div>
            )}
          </div>
        )}

        <div className="post-stats-row">
          <div className="stats-likes-left" onClick={handleLikeToggle}>
            <FontAwesomeIcon icon={likesCount > 0 ? faHeart : farHeart} style={{ fontSize: 16, color: likesCount > 0 ? '#ed4956' : 'currentColor' }} />
            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          </div>

          <div
            className="stats-comments-right"
            onClick={openPostModal}
          >
            <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>

        <div className="post-section-divider" />

        <div className="post-action-buttons-grid">
          <button
            className={`post-footer-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeToggle}
          >
            <FontAwesomeIcon icon={isLiked ? faHeart : farHeart} style={{ fontSize: 18, color: isLiked ? '#ed4956' : 'currentColor' }} />
            <span>Like</span>
          </button>

          <button
            className="post-footer-btn"
            onClick={openPostModal}
          >
            <FontAwesomeIcon icon={farComment} style={{ fontSize: 18 }} />
            <span>Comment</span>
          </button>

          <button className="post-footer-btn" onClick={handleShare}>
            <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: 18 }} />
            <span>Share</span>
          </button>
        </div>
      </article>

      {showEditModal && (
        <div
          className="modal-overlay postcard-edit-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="edit-post-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-post-header">
              <h2>Edit Post</h2>
              <button className="icon-btn-ghost" onClick={() => setShowEditModal(false)}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
              </button>
            </div>

            {editError && <div className="edit-error-banner">{editError}</div>}

            <form onSubmit={handleEditSubmit} className="edit-post-form">
              <div className="edit-form-group">
                <label>Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={4}
                  maxLength={2200}
                  className="edit-caption-textarea"
                />
              </div>

              <div className="edit-form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Add location..."
                  className="edit-location-input"
                />
              </div>

              <div className="edit-post-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Done'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
