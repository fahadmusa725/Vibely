import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StoryViewerModal from './StoryViewerModal';
import CreateStoryModal from './CreateStoryModal';
import { getAvatarUrl } from '../../utils/avatar';
import './StoriesTray.css';

const StoriesTray = () => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStories = async () => {
    if (!isAuthenticated) {
      setGroups([]);
      return;
    }
    try {
      const res = await api.get('/stories/feed');
      setGroups(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
    }
  };

  useEffect(() => {
    fetchStories();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const myGroup = groups.find((g) => g.user._id === user?._id);

  const handleOpenViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  return (
    <div className="stories-tray-container">
      <div className="stories-scroll-wrapper">
        <div className="story-item my-story-item">
          <div
            className={`story-avatar-ring ${
              myGroup ? (myGroup.hasUnseenStories ? 'unseen' : 'seen') : 'add-story'
            }`}
            onClick={() => {
              if (myGroup && myGroup.stories.length > 0) {
                const myIdx = groups.findIndex((g) => g.user._id === user._id);
                handleOpenViewer(myIdx);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            <img
              src={getAvatarUrl(user?.avatar, user?.fullName)}
              alt={user?.username || 'My Story'}
              className="story-avatar-img"
            />
            <button
              className="add-story-btn"
              title="Add Story"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
            >
              +
            </button>
          </div>
          <span className="story-username">Your Story</span>
        </div>

        {groups
          .filter((g) => g.user._id !== user?._id)
          .map((group) => {
            const globalIdx = groups.findIndex((g) => g.user._id === group.user._id);
            return (
              <div
                key={group.user._id}
                className="story-item"
                onClick={() => handleOpenViewer(globalIdx)}
              >
                <div
                  className={`story-avatar-ring ${
                    group.hasUnseenStories ? 'unseen' : 'seen'
                  }`}
                >
                  <img
                    src={getAvatarUrl(group.user.avatar, group.user.fullName)}
                    alt={group.user.username}
                    className="story-avatar-img"
                  />
                </div>
                <span className="story-username">{group.user.username}</span>
              </div>
            );
          })}
      </div>

      {activeGroupIndex !== null && (
        <StoryViewerModal
          groups={groups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => {
            setActiveGroupIndex(null);
            fetchStories();
          }}
        />
      )}

      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
};

export default StoriesTray;
