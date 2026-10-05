import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faCheck, faChevronLeft, faChevronRight, faHeart, faLocationDot, faPaperPlane, faPen, faReply, faThumbtack, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark, faComment as farComment, faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import { formatRelativeTime, formatFullDateTooltip } from '../utils/formatTime';
import api from '../services/api';
import './PostDetailModal.css';

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


const PostDetailModal = ({ post: initialPost, isOpen, onClose, onPostUpdated }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(initialPost?.isLiked || false);
  const [likesCount, setLikesCount] = useState(initialPost?.likesCount || 0);
  const [isSaved, setIsSaved] = useState(initialPost?.isSaved || false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [replyingTo, setReplyingTo] = useState(null);
  const commentInputRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isPostOwner = user && post && (user._id === post.author?._id || user._id === post.author);

  useEffect(() => {
    if (initialPost && isOpen) {
      setPost(initialPost);
      setIsLiked(initialPost.isLiked || false);
      setLikesCount(initialPost.likesCount || 0);
      setIsSaved(initialPost.isSaved || false);
      fetchComments(initialPost._id);
    }
  }, [initialPost, isOpen]);

  if (!isOpen || !post) return null;

  const reportChange = (changes) => {
    if (onPostUpdated) onPostUpdated({ ...post, isLiked, likesCount, isSaved, ...changes });
  };

  const updateCommentsCount = (commentsCount) => {
    setPost((prev) => ({ ...prev, commentsCount }));
    reportChange({ commentsCount });
  };

  const images = post.images && post.images.length > 0 ? post.images : [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080' }];

  const fetchComments = async (postId) => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/${postId}`);
      if (res.data.success) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error('Fetch comments failed:', err);
    } finally {
      setLoadingComments(false);
    }
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

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const nextState = !isLiked;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextState);
    setLikesCount(nextCount);
    if (nextState) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 800);
    }

    try {
      await api.post(`/posts/${post._id}/like`);
      reportChange({ isLiked: nextState, likesCount: nextCount });
    } catch {
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      const res = await api.post(`/posts/${post._id}/save`);
      reportChange({ isSaved: res.data.isSaved });
    } catch (err) {
      setIsSaved(!nextState);
      console.error('Save toggle error:', err);
    }
  };

  const focusComment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    commentInputRef.current?.focus();
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
    }
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const payload = { text: commentText };
      if (replyingTo) payload.parentComment = replyingTo.commentId;

      const res = await api.post(`/comments/${post._id}`, payload);
      if (res.data.success) {
        const newComment = res.data.data;
        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === replyingTo.commentId
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, { ...newComment, replies: [] }]);
        }
        setCommentText('');
        setReplyingTo(null);
        updateCommentsCount((post.commentsCount || 0) + 1);
      }
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    try {
      await api.delete(`/comments/${commentId}`);
      const target = comments.find((c) => c._id === commentId);
      const removed = parentId ? 1 : 1 + (target?.replies?.length || 0);
      updateCommentsCount(Math.max(0, (post.commentsCount || 0) - removed));
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r._id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      const res = await api.patch(`/comments/${commentId}/pin`);
      if (res.data.success) {
        await fetchComments(post._id);
      }
    } catch (err) {
      console.error('Pin comment error:', err);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo({ commentId: comment._id, username: comment.author?.username });
    setCommentText(`@${comment.author?.username} `);
    commentInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const openEditModal = () => {
    setEditCaption(post.caption || '');
    setEditLocation(post.location || '');
    setEditImages([]);
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
      editImages.forEach((file) => formData.append('images', file));

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

  const CommentItem = ({ comment, isReply = false, parentId = null }) => {
    const canDelete =
      user &&
      (user._id === comment.author?._id ||
        user._id === post.author?._id ||
        user._id === post.author);

    return (
      <div className={`comment-item ${isReply ? 'comment-reply' : ''} ${comment.isPinned ? 'comment-pinned' : ''}`}>
        {isReply && <FontAwesomeIcon icon={faReply} style={{ fontSize: 13 }} className="reply-arrow" />}
        <img
          src={comment.author?.avatar}
          alt={comment.author?.username}
          className="comment-avatar"
        />
        <div className="comment-body">
          {comment.isPinned && (
            <div className="pinned-badge">
              <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: 10 }} /> Pinned
            </div>
          )}
          <p>
            <strong className="comment-user">{comment.author?.username}</strong>{' '}
            {comment.text}
          </p>
          <div className="comment-footer">
            <span
              className="comment-time"
              title={formatFullDateTooltip(comment.createdAt)}
            >
              {formatRelativeTime(comment.createdAt)}
            </span>
            {!isReply && isAuthenticated && (
              <button
                className="comment-action-btn"
                onClick={() => handleReply(comment)}
              >
                Reply
              </button>
            )}
            {isPostOwner && !isReply && (
              <button
                className={`comment-action-btn ${comment.isPinned ? 'comment-unpin' : ''}`}
                onClick={() => handlePinComment(comment._id)}
              >
                <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: 11 }} />
                {comment.isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            {canDelete && (
              <button
                className="comment-delete-btn"
                onClick={() => handleDeleteComment(comment._id, parentId)}
                title="Delete comment"
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div
            className="modal-media-pane"
            onDoubleClick={handleImageDoubleTap}
          >
            <img
              src={images[currentImageIndex]?.url}
              alt="Post content"
              className="detail-main-image"
            />

            {images.length > 1 && (
              <>
                <button
                  className="carousel-btn prev"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev > 0 ? prev - 1 : images.length - 1
                    )
                  }
                >
                  <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
                </button>
                <button
                  className="carousel-btn next"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev < images.length - 1 ? prev + 1 : 0
                    )
                  }
                >
                  <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 18 }} />
                </button>
              </>
            )}

            {likeAnimating && (
              <div className="heart-pulse-overlay">
                <FontAwesomeIcon icon={faHeart} style={{ fontSize: 96, color: '#ed4956' }} className="animated-heart" />
              </div>
            )}
          </div>

          <div className="modal-info-pane">
            <div className="detail-header">
              <div className="detail-author-box">
                <div className="story-ring-wrapper">
                  <div className="story-ring-inner">
                    <img
                      src={post.author?.avatar}
                      alt={post.author?.fullName}
                      className="detail-avatar"
                    />
                  </div>
                </div>
                <div className="detail-meta">
                  <div className="detail-name-row">
                    <span className="detail-username">{post.author?.username}</span>
                    {post.author?.isVerified && <VerifiedBadge size={14} />}
                  </div>
                  {post.location && (
                    <span className="detail-location">
                      <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 10 }} /> {post.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="detail-header-actions">
                {isPostOwner && (
                  <button className="icon-btn-ghost" onClick={openEditModal} title="Edit post">
                    <FontAwesomeIcon icon={faPen} style={{ fontSize: 16 }} />
                  </button>
                )}
                <button className="icon-btn-ghost" onClick={onClose} title="Close modal">
                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <div className="detail-comments-list">
              {post.caption && (
                <div className="comment-item author-caption">
                  <img
                    src={post.author?.avatar}
                    alt={post.author?.username}
                    className="comment-avatar"
                  />
                  <div className="comment-body">
                    <p>
                      <strong className="comment-user">{post.author?.username}</strong>{' '}
                      {renderCaption(post.caption, navigate)}
                    </p>
                    <span
                      className="comment-time"
                      title={formatFullDateTooltip(post.createdAt)}
                    >
                      {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              {loadingComments ? (
                <div className="comments-loading">
                  <div className="skeleton" style={{ height: 20, marginBottom: 10, width: '70%' }} />
                  <div className="skeleton" style={{ height: 20, marginBottom: 10, width: '85%' }} />
                  <div className="skeleton" style={{ height: 20, width: '60%' }} />
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id}>
                    <CommentItem comment={comment} />
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-list">
                        {comment.replies.map((reply) => (
                          <CommentItem
                            key={reply._id}
                            comment={reply}
                            isReply
                            parentId={comment._id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-comments-prompt">
                  <p>No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <div className="detail-actions-panel">
              <div className="detail-action-buttons">
                <div className="actions-left">
                  <button
                    className={`action-btn-icon ${isLiked ? 'liked' : ''}`}
                    onClick={handleLikeToggle}
                    aria-label="Like"
                  >
                    <FontAwesomeIcon icon={isLiked ? faHeart : farHeart} style={{ fontSize: 24, color: isLiked ? '#ed4956' : 'currentColor' }} />
                  </button>

                  <button className="action-btn-icon" aria-label="Comment" onClick={focusComment}>
                    <FontAwesomeIcon icon={farComment} style={{ fontSize: 24 }} />
                  </button>

                  <button className="action-btn-icon" aria-label="Share" onClick={handleShare}>
                    <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 22 }} />
                  </button>
                </div>

                <button
                  className={`action-btn-icon ${isSaved ? 'saved' : ''}`}
                  onClick={handleSaveToggle}
                  aria-label="Save post"
                >
                  <FontAwesomeIcon icon={isSaved ? faBookmark : farBookmark} style={{ fontSize: 24 }} />
                </button>
              </div>

              <div className="likes-tally">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</div>
              <span className="post-detail-timestamp" title={formatFullDateTooltip(post.createdAt)}>
                {formatRelativeTime(post.createdAt).toUpperCase()} AGO
              </span>
            </div>

            {isAuthenticated ? (
              <form className="detail-comment-form sticky-comment-form" onSubmit={handleAddComment}>
                {replyingTo && (
                  <div className="reply-indicator">
                    <FontAwesomeIcon icon={faReply} style={{ fontSize: 12 }} />
                    <span>Replying to <strong>@{replyingTo.username}</strong></span>
                    <button type="button" className="cancel-reply-btn" onClick={cancelReply}>
                      <FontAwesomeIcon icon={faXmark} style={{ fontSize: 12 }} />
                    </button>
                  </div>
                )}
                <div className="detail-comment-input-row">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="detail-comment-input"
                  />
                  {commentText.trim() && (
                    <button
                      type="submit"
                      className="detail-comment-submit"
                      disabled={submittingComment}
                    >
                      Post
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="login-to-comment">
                <span>Log in to like or comment.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="detail-toast">
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 16 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay edit-post-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-post-modal card" onClick={(e) => e.stopPropagation()}>
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
                  rows={4}
                  className="edit-caption-textarea"
                />
              </div>

              <div className="edit-form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
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

export default PostDetailModal;
