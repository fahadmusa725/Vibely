import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';
import './StoryViewerModal.css';

const StoryViewerModal = ({ groups, initialGroupIndex, onClose }) => {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const viewRequest = useRef(null);

  const closeViewer = useCallback(async () => {
    await viewRequest.current;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (currentStory && !currentStory.isSeen) {
      viewRequest.current = api
        .post(`/stories/${currentStory._id}/view`)
        .catch((err) => {
          console.error('Failed to mark story as viewed:', err);
        });
    }
  }, [currentStory]);

  useEffect(() => {
    if (!currentStory) return;
    const timer = setTimeout(() => {
      if (storyIndex < currentGroup.stories.length - 1) {
        setStoryIndex((prev) => prev + 1);
      } else if (groupIndex < groups.length - 1) {
        setGroupIndex((prev) => prev + 1);
        setStoryIndex(0);
      } else {
        closeViewer();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentGroup, currentStory, groupIndex, storyIndex, groups, closeViewer]);

  if (!currentGroup || !currentStory) return null;

  const isMyStory = currentGroup.user._id === user?._id;

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      closeViewer();
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
      closeViewer();
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={closeViewer}>
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
              src={getAvatarUrl(currentGroup.user.avatar, currentGroup.user.fullName)}
              alt={currentGroup.user.username}
              className="story-viewer-avatar"
            />
            <span className="story-viewer-username">{currentGroup.user.username}</span>
          </div>
          <div className="story-viewer-actions">
            {isMyStory && (
              <button className="story-delete-btn" onClick={handleDelete} title="Delete Story">
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: 18 }} />
              </button>
            )}
            <button className="story-close-btn" onClick={closeViewer}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
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
