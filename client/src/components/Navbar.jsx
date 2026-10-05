import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCompass, faFire, faGear, faHouse, faMagnifyingGlass, faMoon, faRightFromBracket, faSun, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faBell as farBell, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, unreadCount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-left">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <div className="brand-badge">
              <FontAwesomeIcon icon={faFire} style={{ fontSize: 20 }} className="brand-flame" />
            </div>
            <span className="brand-title">Vibely</span>
          </div>

          <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 17 }} className="search-pill-icon" />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search Vibely..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <nav className="navbar-center-tabs">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
            title="Feed"
          >
            <FontAwesomeIcon icon={faHouse} style={{ fontSize: 22 }} />
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
            title="Discover"
          >
            <FontAwesomeIcon icon={faCompass} style={{ fontSize: 22 }} />
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
            title="People"
          >
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 22 }} />
          </NavLink>

          <NavLink
            to="/saved"
            className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
            title="Saved"
          >
            <FontAwesomeIcon icon={farBookmark} style={{ fontSize: 22 }} />
          </NavLink>
        </nav>

        <div className="navbar-right-actions">
          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-bell-btn ${isActive ? 'active' : ''}`}
            title="Notifications"
          >
            <FontAwesomeIcon icon={farBell} style={{ fontSize: 20 }} />
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>

          {isAuthenticated ? (
            <div className="avatar-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="avatar-dropdown-trigger"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label="User menu"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                  alt={user?.fullName || 'Avatar'}
                  className="nav-avatar-img"
                />
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{ fontSize: 15 }}
                  className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="avatar-dropdown-menu">
                  <div
                    className="dropdown-user-header"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/profile/${user?.username}`);
                    }}
                  >
                    <img src={user?.avatar} alt="" className="dropdown-user-avatar" />
                    <div className="dropdown-user-info">
                      <span className="dropdown-user-name">{user?.fullName}</span>
                      <span className="dropdown-user-handle">@{user?.username}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/profile/${user?.username}`);
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} style={{ fontSize: 17 }} />
                    <span>Profile</span>
                  </button>

                  <button
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <FontAwesomeIcon icon={faGear} style={{ fontSize: 17 }} />
                    <span>Settings</span>
                  </button>

                  <button
                    className="dropdown-item-btn"
                    onClick={() => {
                      toggleTheme();
                    }}
                  >
                    {theme === 'light' ? <FontAwesomeIcon icon={faMoon} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faSun} style={{ fontSize: 17 }} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item-btn danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 17 }} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary">
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
