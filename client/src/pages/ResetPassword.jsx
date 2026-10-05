import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faEye, faEyeSlash, faLock, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import './ForgotPassword.css';
import './ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSession(res.data.data);
          navigate('/');
        }, 2500);
      } else {
        setError(res.data.message || 'Password reset failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-error-banner">
            <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 18 }} />
            <span>Invalid reset link. Please request a new password reset.</span>
          </div>
          <div className="auth-footer-toggle">
            <Link to="/forgot-password" className="auth-link">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 26 }} />
          </div>
          <h1>Vibely</h1>
          <p>Set a new password</p>
        </div>

        {!success ? (
          <>
            {error && (
              <div className="auth-error-banner">
                <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 18 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label>New Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
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

              <div className="auth-input-group">
                <label>Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirm((p) => !p)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faEye} style={{ fontSize: 17 }} />}
                  </button>
                </div>
              </div>

              <div className="rp-strength-bar">
                <div
                  className={`rp-strength-fill ${
                    password.length === 0
                      ? ''
                      : password.length < 6
                      ? 'weak'
                      : password.length < 10
                      ? 'medium'
                      : 'strong'
                  }`}
                />
                <span className="rp-strength-label">
                  {password.length === 0
                    ? ''
                    : password.length < 6
                    ? 'Too short'
                    : password.length < 10
                    ? 'Medium strength'
                    : 'Strong password'}
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="fp-success-state">
            <div className="fp-success-icon">
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 48 }} />
            </div>
            <h2>Password Reset!</h2>
            <p>Your password has been changed successfully. Redirecting you to the home page...</p>
          </div>
        )}

        <div className="auth-footer-toggle">
          <p>
            Remembered your password?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
