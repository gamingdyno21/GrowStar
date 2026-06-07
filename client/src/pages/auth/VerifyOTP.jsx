import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.verifyOTP(email, otp);
      if (res.success) {
        setApiSuccess('Verification successful! Redirecting...');
        showToast('OTP verified successfully! Redirecting...', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const msg = 'Invalid or expired OTP code.';
        setApiError(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors({ email: 'Enter your email address first' });
      showToast('Enter your email address first', 'warning');
      return;
    }
    setApiError('');
    setApiSuccess('');
    try {
      await authService.requestOTP(email);
      setApiSuccess('A new OTP has been sent. Check your inbox!');
      showToast('A new OTP has been sent. Check your inbox!', 'success');
    } catch (err) {
      const msg = 'Failed to send OTP.';
      setApiError(msg);
      showToast(msg, 'error');
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

      <div className="auth-page-transition" style={{ width: '100%', maxWidth: '440px', zIndex: 10 }}>
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
          <div className="mb-4 text-center">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              OTP Verification
            </h3>
            <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.8125rem' }}>
              Verify your email address
            </p>
          </div>

          {apiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-4 p-3 border-0">
              <i className="bi bi-check-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
              <span>{apiSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({});
                  }}
                  placeholder="name@email.com"
                />
              </div>
              {errors.email && (
                <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* OTP Field */}
            <div className="mb-3">
              <label className="form-label">Verification Code (OTP)</label>
              <input
                type="text"
                className={`form-control text-center fw-bold ${errors.otp ? 'is-invalid' : ''}`}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrors({});
                }}
                maxLength="6"
                placeholder="• • • • • •"
                style={{ letterSpacing: '0.4em', fontSize: '1.2rem' }}
              />
              {errors.otp && (
                <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                  {errors.otp}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 mt-2"
              disabled={submitting}
            >
              {submitting ? (
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
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend Button */}
          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link text-decoration-none btn-sm"
              style={{ color: '#d4af37', fontWeight: 600 }}
              onClick={handleResend}
            >
              Resend OTP code
            </button>
          </div>

          <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          
          <div className="text-center">
            <Link
              to="/login"
              style={{ color: '#d4af37', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}
            >
              <i className="bi bi-arrow-left"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
