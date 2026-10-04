import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleExclamation, faEnvelope, faEye, faEyeSlash, faLock, faUser, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    loginId: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await login(formData.loginId, formData.password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.message || 'Invalid credentials');
        }
      } else {
        const res = await register({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
        if (res.success) {
          navigate('/');
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 26 }} />
          </div>
          <h1>Vibely</h1>
          <p>
            {isLogin
              ? 'Welcome back! Share what inspires you.'
              : 'Join a modern community of creators & thinkers.'}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 18 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            <>
              <div className="auth-input-group">
                <label>Email or Username</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type="text"
                    name="loginId"
                    placeholder="e.g. sophia_arts or sophia@example.com"
                    value={formData.loginId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label>Password</label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faEye} style={{ fontSize: 17 }} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-input-group">
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Sophia Chen"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Username</label>
                <div className="auth-input-wrapper">
                  <span className="auth-at-prefix">@</span>
                  <input
                    type="text"
                    name="username"
                    placeholder="sophia_arts"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Email</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="sophia@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faEye} style={{ fontSize: 17 }} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 18 }} />
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isLogin ? (
            <p>
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-link">
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
