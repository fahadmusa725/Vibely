import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleCheck, faCircleExclamation, faEnvelope, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import './Auth.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });

      if (!res.data.success) {
        setError(res.data.message || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);

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
          <p>Reset your password</p>
        </div>

        {!success ? (
          <>
            <p className="fp-subtitle">
              Enter the email address linked to your account and we'll send you a password reset link.
            </p>

            {error && (
              <div className="auth-error-banner">
                <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 18 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="sophia@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="fp-success-state">
            <div className="fp-success-icon">
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 48 }} />
            </div>
            <h2>Check your inbox</h2>
            <p>
              If an account with <strong>{email}</strong> exists, a password reset link has been sent.
              Check your email and follow the instructions.
            </p>
            <p className="fp-hint">Didn't receive it? Check your spam folder or try again in a moment.</p>

            <button
              className="btn btn-secondary fp-retry-btn"
              onClick={() => { setSuccess(false); setEmail(''); }}
            >
              Try a different email
            </button>
          </div>
        )}

        <div className="auth-footer-toggle">
          <p>
            <Link to="/login" className="auth-link fp-back-link">
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 14 }} /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
