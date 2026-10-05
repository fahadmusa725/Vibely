import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PostDetailModal from '../components/PostDetailModal';
import './PostPage.css';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    api
      .get(`/posts/${id}`)
      .then((res) => {
        if (!ignore) setPost(res.data.data);
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

  return (
    <PostDetailModal post={post} isOpen onClose={goBack} onPostUpdated={setPost} />
  );
};

export default PostPage;
