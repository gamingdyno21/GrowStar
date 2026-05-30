import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from route state if redirecting from somewhere, otherwise empty
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
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setApiError('Invalid or expired OTP code.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors({ email: 'Enter your email address first' });
      return;
    }
    setApiError('');
    setApiSuccess('');
    try {
      await authService.requestOTP(email);
      setApiSuccess('A new OTP has been sent. Check your logs!');
    } catch (err) {
      setApiError('Failed to send OTP.');
    }
  };

  return (
    <div className="auth-layout">
      {/* Background Visuals */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>
      <div className="auth-bg-grid"></div>
      
      {/* Floating graph lines */}
      <div className="auth-bg-graph">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path 
            className="auth-graph-line" 
            d="M0,80 Q100,40 200,60 T400,20 T600,70 T800,30 T1000,50" 
          />
        </svg>
      </div>

      {/* Floating gold particles */}
      <div className="auth-particle" style={{ left: '10%', top: '20%', animationDelay: '0s', animationDuration: '12s' }}></div>
      <div className="auth-particle" style={{ left: '30%', top: '45%', animationDelay: '2s', animationDuration: '18s' }}></div>
      <div className="auth-particle" style={{ left: '60%', top: '15%', animationDelay: '1s', animationDuration: '14s' }}></div>
      <div className="auth-particle" style={{ left: '85%', top: '35%', animationDelay: '4s', animationDuration: '16s' }}></div>

      <div className="w-100 auth-page-transition d-flex flex-column align-items-center" style={{ maxWidth: '440px', zIndex: 10 }}>
        <div className="text-center mb-4">
          <BrandLogo width={64} height={64} className="mb-2" />
          <h2 className="fw-bold mt-2 text-white" style={{ letterSpacing: '-0.5px' }}>OTP Verification</h2>
          <p className="text-muted small fw-medium">Verify your email address</p>
        </div>

        <Card className="auth-card" title="Enter 6-Digit OTP">
          {apiError && <div className="alert alert-danger small py-2 bg-danger-subtle border-danger text-danger-emphasis">{apiError}</div>}
          {apiSuccess && <div className="alert alert-success small py-2 bg-success-subtle border-success text-success-emphasis">{apiSuccess}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
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
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

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
                style={{ letterSpacing: '0.3em', fontSize: '1.2rem' }}
              />
              {errors.otp && <div className="invalid-feedback">{errors.otp}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-3" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center mt-3">
            <button type="button" className="btn btn-link text-decoration-none btn-sm" style={{ color: '#D4AF37' }} onClick={handleResend}>
              Resend OTP code
            </button>
          </div>

          <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <div className="text-center">
            <Link to="/login" className="text-muted small fw-semibold text-decoration-none">
              Back to Login
            </Link>
          </div>

          {/* Trust Badge Indicator */}
          <div className="text-center mt-4">
            <div className="auth-trust-badge">
              <i className="bi bi-shield-fill-check"></i>
              <span>Secure Verification | 256-bit SSL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
