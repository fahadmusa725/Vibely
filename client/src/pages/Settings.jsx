import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faChevronRight, faEye, faEyeSlash, faFloppyDisk, faGear, faLock, faPalette, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import './Settings.css';

const SECTIONS = [
  { id: 'profile', label: 'Edit Profile', icon: faUser },
  { id: 'appearance', label: 'Appearance', icon: faPalette },
  { id: 'security', label: 'Change Password', icon: faLock },
];

const ChangePasswordPanel = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-section-title">Change Password</h2>
      <p className="settings-section-desc">Use at least 6 characters for your new password.</p>

      <div className="settings-field">
        <label htmlFor="settings-current-password">Current password</label>
        <div className="settings-password-wrap">
          <input
            id="settings-current-password"
            type={showCurrent ? 'text' : 'password'}
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="button" className="settings-password-toggle" onClick={() => setShowCurrent((prev) => !prev)} aria-label="Toggle current password visibility">
            <FontAwesomeIcon icon={showCurrent ? faEyeSlash : faEye} style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      <div className="settings-field">
        <label htmlFor="settings-new-password">New password</label>
        <div className="settings-password-wrap">
          <input
            id="settings-new-password"
            type={showNew ? 'text' : 'password'}
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button type="button" className="settings-password-toggle" onClick={() => setShowNew((prev) => !prev)} aria-label="Toggle new password visibility">
            <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      <div className="settings-field">
        <label htmlFor="settings-confirm-password">Confirm new password</label>
        <div className="settings-password-wrap">
          <input
            id="settings-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button type="button" className="settings-password-toggle" onClick={() => setShowConfirm((prev) => !prev)} aria-label="Toggle confirm password visibility">
            <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {error && <p className="settings-error">{error}</p>}
      {success && (
        <p className="settings-success">
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 14 }} /> Password changed successfully!
        </p>
      )}

      <button type="submit" className="btn btn-primary settings-save-btn" disabled={saving}>
        <FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: 16 }} />
        <span>{saving ? 'Saving...' : 'Update Password'}</span>
      </button>
    </form>
  );
};

const EditProfilePanel = ({ user, updateUser }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const res = await api.put('/users/profile', { fullName, bio, website, location });
      if (res.data.success) {
        updateUser({ fullName, bio, website, location });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSave}>
      <h2 className="settings-section-title">Edit Profile</h2>

      <div className="settings-avatar-row">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
          alt={user?.fullName}
          className="settings-avatar"
        />
        <div className="settings-avatar-info">
          <p className="settings-avatar-name">{user?.fullName}</p>
          <p className="settings-avatar-username">@{user?.username}</p>
          <p className="settings-avatar-hint">
            To change your avatar or cover photo, visit your{' '}
            <Link to={`/profile/${user?.username}`}>profile page</Link>.
          </p>
        </div>
      </div>

      <div className="settings-field">
        <label htmlFor="settings-fullname">Full Name</label>
        <input
          id="settings-fullname"
          type="text"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={50}
          placeholder="Your display name"
        />
      </div>

      <div className="settings-field">
        <label htmlFor="settings-bio">Bio</label>
        <textarea
          id="settings-bio"
          className="input settings-textarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder="Tell people a little about yourself..."
          rows={3}
        />
        <span className="settings-char-count">{bio.length}/200</span>
      </div>

      <div className="settings-field">
        <label htmlFor="settings-website">Website</label>
        <input
          id="settings-website"
          type="url"
          className="input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yoursite.com"
        />
      </div>

      <div className="settings-field">
        <label htmlFor="settings-location">Location</label>
        <input
          id="settings-location"
          type="text"
          className="input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={60}
          placeholder="City, Country"
        />
      </div>

      {error && <p className="settings-error">{error}</p>}
      {success && (
        <p className="settings-success">
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 14 }} /> Profile updated successfully!
        </p>
      )}

      <button
        id="settings-save-btn"
        type="submit"
        className="btn btn-primary settings-save-btn"
        disabled={saving}
      >
        <FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: 16 }} />
        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
      </button>
    </form>
  );
};

const AppearancePanel = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="settings-appearance">
      <h2 className="settings-section-title">Appearance</h2>
      <p className="settings-section-desc">Choose how Vibely looks for you.</p>

      <div className="settings-theme-cards">
        <button
          id="settings-theme-dark"
          className={`settings-theme-card ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => theme !== 'dark' && toggleTheme()}
        >
          <div className="settings-theme-preview dark-preview" />
          <span>Dark</span>
          {theme === 'dark' && (
            <span className="settings-theme-check">
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12 }} />
            </span>
          )}
        </button>
        <button
          id="settings-theme-light"
          className={`settings-theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => theme !== 'light' && toggleTheme()}
        >
          <div className="settings-theme-preview light-preview" />
          <span>Light</span>
          {theme === 'light' && (
            <span className="settings-theme-check">
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12 }} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');

  const renderPanel = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearancePanel />;
      case 'security':
        return <ChangePasswordPanel />;
      default:
        return <EditProfilePanel user={user} updateUser={updateUser} />;
    }
  };

  return (
    <div className="settings-page">
      <button className="settings-back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 18 }} />
        <span>Back</span>
      </button>

      <div className="settings-layout">
        <nav className="settings-nav card">
          <div className="settings-nav-header">
            <FontAwesomeIcon icon={faGear} style={{ fontSize: 18 }} />
            <span>Settings</span>
          </div>
          <ul className="settings-nav-list">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  id={`settings-nav-${id}`}
                  className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
                  onClick={() => setActiveSection(id)}
                >
                  <FontAwesomeIcon icon={Icon} style={{ fontSize: 17 }} />
                  <span>{label}</span>
                  <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 14 }} className="settings-nav-arrow" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="settings-panel card">{renderPanel()}</div>
      </div>
    </div>
  );
};

export default Settings;
