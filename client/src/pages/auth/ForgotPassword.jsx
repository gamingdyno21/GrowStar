import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        showToast('Verification OTP sent successfully! Check your inbox.', 'success');
        // Redirect to Reset Password with email state
        navigate('/reset-password', { state: { email } });
      } else {
        const errMsg = res.message || 'Failed to send OTP. Please check email address.';
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error requesting password reset.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
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
          <h2 className="fw-bold mt-2 text-white" style={{ letterSpacing: '-0.5px' }}>Password Recovery</h2>
          <p className="text-muted small fw-medium">Verify ownership of your account</p>
        </div>

        <Card className="auth-card" title="Forgot Password">
          {error && <div className="alert alert-danger small py-2 bg-danger-subtle border-danger text-danger-emphasis">{error}</div>}

          <p className="text-muted small mb-4">
            Enter the email address registered to your account. We will dispatch a 6-digit OTP code to verify your identity.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-2 d-flex align-items-center justify-content-center" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating OTP...
                </>
              ) : 'Send Verification OTP'}
            </button>
          </form>

          <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <div className="text-center">
            <Link to="/login" className="text-muted small fw-semibold text-decoration-none">
              Back to Sign In
            </Link>
          </div>

          {/* Trust Badge Indicator */}
          <div className="text-center mt-4">
            <div className="auth-trust-badge">
              <i className="bi bi-shield-fill-check"></i>
              <span>Secure Recovery | 256-bit SSL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
