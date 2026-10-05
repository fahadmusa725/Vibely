import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheckDouble, faHeart, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faBell as farBell, faMessage as farMessage } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatRelativeTime } from '../utils/formatTime';
import { getAvatarUrl } from '../utils/avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import './Notifications.css';

const TABS = [
  { id: 'all', label: 'All', empty: 'No notifications yet' },
  { id: 'likes', label: 'Likes', empty: 'No likes yet' },
  { id: 'comments', label: 'Comments', empty: 'No comments yet' },
  { id: 'follows', label: 'Follows', empty: 'No new followers yet' },
];

const SNIPPET_LENGTH = 80;

const snippet = (text = '') => (text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}...` : text);

const describe = (n) => {
  if (n.type === 'like') return 'liked your post';
  if (n.type === 'comment') return `commented on your post: ${snippet(n.comment?.text || '')}`;
  if (n.type === 'reply') return `replied to your comment: ${snippet(n.comment?.text || '')}`;
  return 'started following you';
};

const Notifications = () => {
  const { updateUser, refreshUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let ignore = false;
    api
      .get('/notifications', { params: { type: activeTab, page: 1 } })
      .then((res) => {
        if (ignore) return;
        setNotifications(res.data.data);
        setHasMore(res.data.pagination.hasMore);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const changeTab = (tabId) => {
    setLoading(true);
    setPage(1);
    setActiveTab(tabId);
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await api.get('/notifications', { params: { type: activeTab, page: nextPage } });
      setNotifications((prev) => [...prev, ...res.data.data]);
      setHasMore(res.data.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (n) => {
    if (n.read) return;
    setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
    try {
      await api.patch(`/notifications/${n._id}/read`);
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const openNotification = (n) => {
    markRead(n);
    if (n.type === 'follow') {
      navigate(`/profile/${n.sender.username}`);
    } else if (n.post) {
      navigate(`/post/${n.post._id}`);
    }
  };

  const toggleFollowBack = async (n) => {
    try {
      const res = await api.post(`/users/${n.sender._id}/follow`);
      setNotifications((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, isFollowingSender: res.data.isFollowing } : item))
      );
      updateUser({ followingCount: res.data.followingCount });
    } catch (err) {
      console.error('Failed to update follow:', err);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return <div className="notif-badge-icon like"><FontAwesomeIcon icon={faHeart} style={{ fontSize: 12, color: '#fff' }} /></div>;
      case 'follow':
        return <div className="notif-badge-icon follow"><FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 12 }} /></div>;
      default:
        return <div className="notif-badge-icon comment"><FontAwesomeIcon icon={farMessage} style={{ fontSize: 12 }} /></div>;
    }
  };

  const currentTab = TABS.find((tab) => tab.id === activeTab);

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
            onClick={markAllRead}
            title="Mark all as read"
          >
            <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="notif-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => changeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="notif-list card">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="notif-item notif-skeleton">
              <div className="skeleton notif-skeleton-avatar" />
              <div className="notif-skeleton-lines">
                <div className="skeleton notif-skeleton-line" />
                <div className="skeleton notif-skeleton-line short" />
              </div>
            </div>
          ))
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={() => openNotification(n)}
              >
                <div className="notif-left">
                  {!n.read && <span className="notif-unread-dot" />}
                  <div className="notif-avatar-container">
                    <img
                      src={getAvatarUrl(n.sender.avatar, n.sender.fullName)}
                      alt={n.sender.username}
                      className="notif-avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${n.sender.username}`);
                      }}
                    />
                    {renderIcon(n.type)}
                  </div>
                </div>

                <div className="notif-content">
                  <div className="notif-user-row">
                    <span
                      className="notif-username"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${n.sender.username}`);
                      }}
                    >
                      {n.sender.username}
                    </span>
                    {n.sender.isVerified && <VerifiedBadge size={12} />}
                  </div>
                  <p className="notif-body-text">{describe(n)}</p>
                  <span className="notif-timestamp">{formatRelativeTime(n.createdAt)}</span>
                </div>

                <div className="notif-right">
                  {n.post?.images?.[0] && (
                    <img src={n.post.images[0].url} alt="Post" className="notif-media-thumb" />
                  )}
                  {n.type === 'follow' && (
                    <button
                      className={`btn ${n.isFollowingSender ? 'btn-secondary' : 'btn-primary'} notif-action-btn`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowBack(n);
                      }}
                    >
                      {n.isFollowingSender ? 'Following' : 'Follow back'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="notif-load-more">
                <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="notif-empty">
            <FontAwesomeIcon icon={farBell} style={{ fontSize: 36 }} />
            <p>{currentTab.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
