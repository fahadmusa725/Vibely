import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Plus, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MobileNav.css';

const MobileNav = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="mobile-nav-container">
      <NavLink
        to="/"
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        end
        title="Feed"
      >
        <Home size={22} />
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        title="Discover"
      >
        <Compass size={22} />
      </NavLink>

      <button
        className="mob-nav-item create-mob"
        onClick={onOpenCreateModal}
        title="Create Post"
      >
        <div className="plus-btn-inner">
          <Plus size={22} strokeWidth={2.5} />
        </div>
      </button>

      <NavLink
        to="/search"
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        title="Search"
      >
        <Search size={22} />
      </NavLink>

      <NavLink
        to={isAuthenticated ? `/profile/${user?.username}` : '/login'}
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        title="Profile"
      >
        {isAuthenticated && user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="mob-avatar"
          />
        ) : (
          <User size={22} />
        )}
      </NavLink>
    </nav>
  );
};

export default MobileNav;
