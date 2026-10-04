import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheckDouble, faHeart, faRepeat, faTrophy, faUserPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { faBell as farBell, faMessage as farMessage } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import './Notifications.css';

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'like',
    filter: 'likes',
    user: {
      username: 'alex_dev',
      fullName: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    text: 'liked your photo "Midnight in Shinjuku"',
    media: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100',
    time: '12m ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'follow',
    filter: 'follows',
    user: {
      username: 'maya_visuals',
      fullName: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    },
    text: 'started following you',
    time: '1h ago',
    unread: true,
    actionBtn: 'Follow Back',
  },
  {
    id: 'n3',
    type: 'comment',
    filter: 'mentions',
    user: {
      username: 'nathan_k',
      fullName: 'Nathan Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      isVerified: true,
    },
    text: '"The color grading on this is superb! Did you use a custom LUT for the shadows?"',
    time: '3h ago',
    unread: false,
  },
  {
    id: 'n4',
    type: 'repost',
    filter: 'mentions',
    user: {
      username: 'sarah_creates',
      fullName: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    text: 'reposted your post "Design systems survive on constraint, not indulgence..."',
    time: '5h ago',
    unread: false,
  },
  {
    id: 'n5',
    type: 'milestone',
    filter: 'all',
    user: null,
    text: 'Your post reached 10,000 impressions this week.',
    title: 'Weekly Impact • Milestone',
    progress: 100,
    time: '1d ago',
    unread: false,
  },
];

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mentions') return n.filter === 'mentions' || n.type === 'comment';
    if (activeTab === 'follows') return n.filter === 'follows' || n.type === 'follow';
    if (activeTab === 'likes') return n.filter === 'likes' || n.type === 'like';
    return true;
  });

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return <div className="notif-badge-icon like"><FontAwesomeIcon icon={faHeart} style={{ fontSize: 12, color: '#fff' }} /></div>;
      case 'follow':
        return <div className="notif-badge-icon follow"><FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 12 }} /></div>;
      case 'comment':
        return <div className="notif-badge-icon comment"><FontAwesomeIcon icon={farMessage} style={{ fontSize: 12 }} /></div>;
      case 'repost':
        return <div className="notif-badge-icon repost"><FontAwesomeIcon icon={faRepeat} style={{ fontSize: 12 }} /></div>;
      case 'milestone':
        return <div className="notif-badge-icon milestone"><FontAwesomeIcon icon={faTrophy} style={{ fontSize: 12 }} /></div>;
      default:
        return <div className="notif-badge-icon default"><FontAwesomeIcon icon={farBell} style={{ fontSize: 12 }} /></div>;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <div className="notif-header-top">
          <div className="notif-title-wrap">
            <button className="notif-back-btn" onClick={() => navigate(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 18 }} />
            </button>
            <h1 className="notif-title">Notifications</h1>
          </div>
          <button
            className="notif-mark-read"
            onClick={markAllAsRead}
            title="Mark all as read"
          >
            <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="notif-tabs">
          <button
            className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`notif-tab ${activeTab === 'mentions' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentions')}
          >
            Mentions
          </button>
          <button
            className={`notif-tab ${activeTab === 'follows' ? 'active' : ''}`}
            onClick={() => setActiveTab('follows')}
          >
            Follows
          </button>
          <button
            className={`notif-tab ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            Likes
          </button>
        </div>
      </div>

      <div className="notif-list card">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.unread ? 'unread' : ''}`}
            >
              <div className="notif-left">
                {n.unread && <span className="notif-unread-dot" />}
                <div className="notif-avatar-container">
                  {n.user ? (
                    <img
                      src={n.user.avatar}
                      alt={n.user.username}
                      className="notif-avatar"
                      onClick={() => navigate(`/profile/${n.user.username}`)}
                    />
                  ) : (
                    <div className="notif-avatar-placeholder">
                      <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 18 }} />
                    </div>
                  )}
                  {renderIcon(n.type)}
                </div>
              </div>

              <div className="notif-content">
                {n.title ? (
                  <div className="notif-milestone-wrap">
                    <span className="notif-milestone-title">{n.title}</span>
                    <p className="notif-body-text">{n.text}</p>
                    {n.progress !== undefined && (
                      <div className="notif-progress-bar">
                        <div
                          className="notif-progress-fill"
                          style={{ width: `${n.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="notif-user-row">
                      <span
                        className="notif-username"
                        onClick={() => navigate(`/profile/${n.user.username}`)}
                      >
                        {n.user.username}
                      </span>
                      {n.user.isVerified && <VerifiedBadge size={12} />}
                    </div>
                    <p className="notif-body-text">{n.text}</p>
                  </div>
                )}
                <span className="notif-timestamp">{n.time}</span>
              </div>

              <div className="notif-right">
                {n.media && (
                  <img src={n.media} alt="Thumb" className="notif-media-thumb" />
                )}
                {n.actionBtn && (
                  <button className="btn btn-outline notif-action-btn">
                    {n.actionBtn}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">
            <FontAwesomeIcon icon={farBell} style={{ fontSize: 36 }} />
            <p>No notifications in this tab</p>
          </div>
        )}

        <div className="notif-caught-up">
          <div className="caught-up-circle">
            <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: 18 }} />
          </div>
          <span className="caught-up-title">You're all caught up</span>
          <span className="caught-up-sub">No new notifications from the last 7 days</span>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
