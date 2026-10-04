import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHouse, faMagnifyingGlass, faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
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
        <FontAwesomeIcon icon={faHouse} style={{ fontSize: 22 }} />
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        title="Discover"
      >
        <FontAwesomeIcon icon={faCompass} style={{ fontSize: 22 }} />
      </NavLink>

      <button
        className="mob-nav-item create-mob"
        onClick={onOpenCreateModal}
        title="Create Post"
      >
        <div className="plus-btn-inner">
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: 22 }} />
        </div>
      </button>

      <NavLink
        to="/search"
        className={({ isActive }) => `mob-nav-item ${isActive ? 'active' : ''}`}
        title="Search"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 22 }} />
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
          <FontAwesomeIcon icon={faUser} style={{ fontSize: 22 }} />
        )}
      </NavLink>
    </nav>
  );
};

export default MobileNav;
