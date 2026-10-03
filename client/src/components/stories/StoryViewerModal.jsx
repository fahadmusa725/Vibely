import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './StoryViewerModal.css';

const StoryViewerModal = ({ groups, initialGroupIndex, onClose, onStoryDeleted }) => {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  useEffect(() => {
    if (currentStory && user) {
      const isAlreadyViewed = currentStory.viewers?.some(
        (v) => (typeof v === 'string' ? v : v.user?._id || v.user) === user._id
      );
      if (!isAlreadyViewed) {
        api.post(`/stories/${currentStory._id}/view`).catch((err) => {
          console.error('Failed to mark story as viewed:', err);
        });
      }
    }
  }, [currentStory, user]);

  useEffect(() => {
    if (!currentStory) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, [groupIndex, storyIndex, groups]);

  if (!currentGroup || !currentStory) return null;

  const isMyStory = currentGroup.user._id === user?._id;

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await api.delete(`/stories/${currentStory._id}`);
      if (onStoryDeleted) onStoryDeleted();
      if (currentGroup.stories.length <= 1) {
        onClose();
      } else {
        setStoryIndex((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="story-progress-bar-container">
          {currentGroup.stories.map((s, idx) => (
            <div key={s._id} className="story-progress-track">
              <div
                className={`story-progress-fill ${
                  idx < storyIndex ? 'completed' : idx === storyIndex ? 'active' : ''
                }`}
              />
            </div>
          ))}
        </div>

        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <img
              src={currentGroup.user.avatar || 'https://via.placeholder.com/150'}
              alt={currentGroup.user.username}
              className="story-viewer-avatar"
            />
            <span className="story-viewer-username">{currentGroup.user.username}</span>
          </div>
          <div className="story-viewer-actions">
            {isMyStory && (
              <button className="story-delete-btn" onClick={handleDelete} title="Delete Story">
                🗑️
              </button>
            )}
            <button className="story-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="story-media-container">
          <img src={currentStory.mediaUrl} alt="Story" className="story-media-img" />
          <div className="story-nav-area left" onClick={handlePrev} />
          <div className="story-nav-area right" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
};

export default StoryViewerModal;
