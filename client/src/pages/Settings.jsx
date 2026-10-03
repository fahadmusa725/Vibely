import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  ChevronRight,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import './Settings.css';

const SECTIONS = [
  { id: 'profile', label: 'Edit Profile', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
];

const PlaceholderPanel = ({ label }) => (
  <div className="settings-placeholder">
    <div className="settings-placeholder-icon">
      <SettingsIcon size={32} />
    </div>
    <h3>{label}</h3>
    <p>This section is coming soon. Stay tuned for updates.</p>
  </div>
);

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
            <a href={`/profile/${user?.username}`}>profile page</a>.
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
          placeholder="Tell people a little about yourself…"
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
      {success && <p className="settings-success">✓ Profile updated successfully!</p>}

      <button
        id="settings-save-btn"
        type="submit"
        className="btn btn-primary settings-save-btn"
        disabled={saving}
      >
        <Save size={16} />
        <span>{saving ? 'Saving…' : 'Save Changes'}</span>
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
          {theme === 'dark' && <span className="settings-theme-check">✓</span>}
        </button>
        <button
          id="settings-theme-light"
          className={`settings-theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => theme !== 'light' && toggleTheme()}
        >
          <div className="settings-theme-preview light-preview" />
          <span>Light</span>
          {theme === 'light' && <span className="settings-theme-check">✓</span>}
        </button>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');

  if (!isAuthenticated) {
    return (
      <div className="settings-unauthenticated">
        <h2>Sign in to access Settings</h2>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activeSection) {
      case 'profile':
        return <EditProfilePanel user={user} updateUser={updateUser} />;
      case 'appearance':
        return <AppearancePanel />;
      default:
        return (
          <PlaceholderPanel
            label={SECTIONS.find((s) => s.id === activeSection)?.label || 'Settings'}
          />
        );
    }
  };

  return (
    <div className="settings-page">
      <button className="settings-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="settings-layout">
        <nav className="settings-nav card">
          <div className="settings-nav-header">
            <SettingsIcon size={18} />
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
                  <Icon size={17} />
                  <span>{label}</span>
                  <ChevronRight size={14} className="settings-nav-arrow" />
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
