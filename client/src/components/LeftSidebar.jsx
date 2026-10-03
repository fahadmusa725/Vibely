import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Users,
  Bookmark,
  Bell,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from './VerifiedBadge';
import './LeftSidebar.css';

const LeftSidebar = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="left-sidebar">
      {isAuthenticated && user && (
        <div
          className="ls-mini-profile-card card"
          onClick={() => navigate(`/profile/${user.username}`)}
        >
          <div className="ls-mp-header">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt={user.fullName}
              className="ls-mp-avatar"
            />
            <div className="ls-mp-meta">
              <div className="ls-mp-name-row">
                <span className="ls-mp-name">{user.fullName}</span>
                {user.isVerified && <VerifiedBadge size={13} />}
              </div>
              <span className="ls-mp-username">@{user.username}</span>
            </div>
          </div>

          <div className="ls-mp-stats">
            <div className="ls-mp-stat">
              <span className="ls-mp-num">{user.postsCount ?? 0}</span>
              <span className="ls-mp-label">{(user.postsCount ?? 0) === 1 ? 'Post' : 'Posts'}</span>
            </div>
            <div className="ls-mp-stat">
              <span className="ls-mp-num">{user.followersCount ?? user.followers?.length ?? 0}</span>
              <span className="ls-mp-label">Followers</span>
            </div>
            <div className="ls-mp-stat">
              <span className="ls-mp-num">{user.followingCount ?? user.following?.length ?? 0}</span>
              <span className="ls-mp-label">Following</span>
            </div>
          </div>
        </div>
      )}

      <nav className="ls-nav-list">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Feed</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
        >
          <Compass size={20} />
          <span>Discover</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>People</span>
        </NavLink>

        <NavLink
          to="/saved"
          className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
        >
          <Bookmark size={20} />
          <span>Saved</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell size={20} />
          <span>Notifications</span>
        </NavLink>

        {isAuthenticated && user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) => `ls-nav-item ${isActive ? 'active' : ''}`}
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        )}

        {isAuthenticated && (
          <button
            className="ls-nav-item ls-action-btn"
            onClick={() => navigate('/settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        )}
      </nav>

      <footer className="ls-footer">
        <div className="ls-footer-links">
          <span>Privacy</span> · <span>Terms</span> · <span>Help</span>
        </div>
        <p className="ls-copyright">© Vibely</p>
      </footer>
    </aside>
  );
};

export default LeftSidebar;
