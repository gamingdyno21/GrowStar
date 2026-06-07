import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import BrandLogo from '../../components/common/BrandLogo';

const PARTICLES = [
  { left: 8, top: 20, delay: 0, duration: 15 },
  { left: 25, top: 40, delay: 2, duration: 18 },
  { left: 45, top: 15, delay: 1, duration: 13 },
  { left: 62, top: 50, delay: 4, duration: 20 },
  { left: 78, top: 25, delay: 3, duration: 16 },
  { left: 90, top: 60, delay: 5, duration: 19 },
  { left: 15, top: 75, delay: 0.5, duration: 14 },
  { left: 33, top: 82, delay: 2.5, duration: 17 },
  { left: 55, top: 68, delay: 1.5, duration: 15 },
  { left: 70, top: 85, delay: 3.5, duration: 18 },
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email is required');
      showToast('Email is required', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.requestOTP(email);
      if (res.success) {
        showToast('Verification OTP sent! Check your inbox.', 'success');
        setSent(true);
        setTimeout(() => navigate('/reset-password', { state: { email } }), 1500);
      } else {
        const msg = res.message || 'Failed to send OTP. Please check email address.';
        setError(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error requesting password reset.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Background glow elements */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>
      <div className="auth-bg-grid"></div>

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="auth-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div className="auth-page-transition" style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
        {/* Top Branding Section */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2">
            <BrandLogo width={40} height={40} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              GrowStar
            </span>
          </div>
        </div>

        {/* Centered Glassmorphic Card */}
        <div className="auth-card-dark w-100">
          {sent ? (
            <div className="text-center py-2 animate-fade">
              <div className="success-circle" style={{ margin: '0 auto 1.25rem' }}>
                <i className="bi bi-envelope-check" style={{ fontSize: '2.25rem', color: '#34d399' }}></i>
              </div>
              <h5 style={{ color: '#34d399', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>OTP Sent!</h5>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.875rem' }}>
                Redirecting to reset password page...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-center">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Reset Password
                </h3>
                <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.8125rem' }}>
                  We'll send a verification code to your email
                </p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
                  <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
                  <span>{error}</span>
                </div>
              )}

              <p className="text-muted mb-4" style={{ fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'center' }}>
                Enter the email address registered to your account. We'll dispatch a 6-digit OTP to verify your identity.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-envelope input-icon"></i>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(3, 7, 18, 0.2)',
                          borderTopColor: '#030712',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                          display: 'inline-block'
                        }}
                      />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send"></i>
                      Send Verification OTP
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="text-center mt-4">
            <Link
              to="/login"
              style={{ color: '#d4af37', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}
            >
              <i className="bi bi-arrow-left"></i>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
