import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faCircle, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import VerifiedBadge from './VerifiedBadge';
import api from '../services/api';
import './RightSidebar.css';

const formatLastActive = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return 'online';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const RightSidebar = ({ suggestedUsers = [], onFollowUser }) => {
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    fetchTrendingTags();
    fetchContacts();
  }, []);

  const fetchTrendingTags = async () => {
    try {
      const res = await api.get('/posts/trending-tags?limit=5');
      if (res.data.success) setTrendingTags(res.data.data);
    } catch (_) {
    }
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await api.get('/users/me/contacts');
      if (res.data.success) setContacts(res.data.data);
    } catch (_) {
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleDismiss = (e, userId) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, userId]);
  };

  const visibleUsers = suggestedUsers.filter((u) => !dismissedIds.includes(u._id));

  return (
    <aside className="right-sidebar">
      <div className="rs-card card">
        <div className="rs-card-header">
          <div className="rs-card-title">
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 18 }} className="rs-title-icon" />
            <h3>Who to Follow</h3>
          </div>
          <button className="rs-see-all-btn" onClick={() => navigate('/search')}>
            See all
          </button>
        </div>

        <div className="rs-user-list">
          {visibleUsers.length > 0 ? (
            visibleUsers.slice(0, 5).map((u) => {
              const mutualText =
                typeof u.mutualCount === 'number' && u.mutualCount > 0
                  ? `${u.mutualCount} mutual`
                  : null;

              return (
                <div
                  key={u._id}
                  className="rs-user-item"
                  onClick={() => navigate(`/profile/${u.username}`)}
                >
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={u.fullName}
                    className="rs-user-avatar"
                  />

                  <div className="rs-user-info">
                    <div className="rs-user-name-row">
                      <span className="rs-user-name">{u.fullName}</span>
                      {u.isVerified && <VerifiedBadge size={13} />}
                    </div>
                    <span className="rs-user-username">@{u.username}</span>
                    {mutualText && (
                      <span className="rs-mutual-count">{mutualText}</span>
                    )}
                  </div>

                  <div className="rs-item-actions">
                    <button
                      className="btn btn-primary btn-sm rs-follow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onFollowUser) onFollowUser(u._id);
                      }}
                    >
                      Follow
                    </button>
                    <button
                      className="rs-dismiss-btn"
                      onClick={(e) => handleDismiss(e, u._id)}
                      title="Dismiss"
                      aria-label="Dismiss suggestion"
                    >
                      <FontAwesomeIcon icon={faXmark} style={{ fontSize: 15 }} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rs-empty">
              <p>No suggestions right now.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rs-card card">
        <div className="rs-card-header">
          <div className="rs-card-title">
            <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: 18 }} className="rs-title-icon" />
            <h3>Trending Now</h3>
          </div>
        </div>

        <div className="rs-tag-list">
          {trendingTags.length > 0 ? (
            trendingTags.map((t, idx) => (
              <button
                key={t.tag}
                className="rs-tag-item"
                onClick={() => navigate(`/explore?tag=${encodeURIComponent(t.tag)}`)}
              >
                <span className="rs-tag-rank">#{idx + 1}</span>
                <div className="rs-tag-info">
                  <span className="rs-tag-name">#{t.tag}</span>
                  <span className="rs-tag-count">{t.count} {t.count === 1 ? 'post' : 'posts'}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="rs-empty">
              <p>No trending tags yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rs-card card">
        <div className="rs-card-header">
          <div className="rs-card-title">
            <FontAwesomeIcon icon={faCircle} className="rs-title-icon" style={{ fontSize: 18, color: 'var(--success)' }} />
            <h3>Contacts</h3>
          </div>
        </div>

        <div className="rs-contact-list">
          {loadingContacts ? (
            <div className="rs-empty"><p>Loading…</p></div>
          ) : contacts.length > 0 ? (
            contacts.map((c) => {
              const status = formatLastActive(c.lastActive);
              const isOnline = status === 'online';
              return (
                <div
                  key={c._id}
                  className="rs-contact-item"
                  onClick={() => navigate(`/profile/${c.username}`)}
                >
                  <div className="rs-contact-avatar-wrap">
                    <img
                      src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={c.name}
                      className="rs-contact-avatar"
                    />
                    {isOnline && <span className="rs-online-dot" aria-label="Online" />}
                  </div>
                  <div className="rs-contact-info">
                    <span className="rs-contact-name">{c.name}</span>
                    <span className={`rs-contact-status ${isOnline ? 'online' : ''}`}>
                      {isOnline ? 'Active now' : `Last seen ${status}`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rs-empty">
              <p>Follow creators to see them here.</p>
              <button className="rs-see-all-btn" style={{ marginTop: 6 }} onClick={() => navigate('/search')}>
                Find People
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
