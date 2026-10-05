import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { formatRelativeTime } from '../utils/formatTime';
import { getAvatarUrl } from '../utils/avatar';
import './PostPage.css';

const PostPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.get(`/posts/${id}`), api.get(`/comments/${id}`)])
      .then(([postRes, commentsRes]) => {
        if (ignore) return;
        setPost(postRes.data.data);
        setComments(commentsRes.data.data);
      })
      .catch((err) => {
        console.error('Failed to load post:', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${post._id}`, { text: commentText });
      setComments((prev) => [...prev, { ...res.data.data, replies: [] }]);
      setPost((prev) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      setCommentText('');
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="post-page-state">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="post-page-state">
        <h2>Post not found</h2>
        <p>This post may have been deleted.</p>
        <button className="btn btn-primary" onClick={goBack}>
          Go back
        </button>
      </div>
    );
  }

  const renderComment = (comment, isReply = false) => (
    <div key={comment._id} className={`post-page-comment ${isReply ? 'reply' : ''}`}>
      <img
        src={getAvatarUrl(comment.author?.avatar, comment.author?.fullName)}
        alt={comment.author?.username}
        className="post-page-comment-avatar"
      />
      <div className="post-page-comment-body">
        <p>
          <strong>{comment.author?.username}</strong> {comment.text}
        </p>
        <span className="post-page-comment-time">{formatRelativeTime(comment.createdAt)}</span>
      </div>
    </div>
  );

  return (
    <div className="post-page">
      <div className="post-page-column">
        <div className="post-page-header">
          <button className="post-page-back" onClick={goBack}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 18 }} />
            <span>Back</span>
          </button>
        </div>

        <PostCard
          post={post}
          onPostUpdated={setPost}
          onPostDeleted={() => navigate('/')}
        />

        <section className="card post-page-comments">
          <h3 className="post-page-comments-title">Comments</h3>

          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id}>
                {renderComment(comment)}
                {comment.replies?.map((reply) => renderComment(reply, true))}
              </div>
            ))
          ) : (
            <p className="post-page-empty">No comments yet. Start the conversation.</p>
          )}

          <form className="post-page-comment-form" onSubmit={handleAddComment}>
            <img
              src={getAvatarUrl(user?.avatar, user?.fullName)}
              alt={user?.username}
              className="post-page-comment-avatar"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="post-page-comment-input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !commentText.trim()}
            >
              Post
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default PostPage;
