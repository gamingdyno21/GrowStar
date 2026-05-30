import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.email) tempErrors.email = 'Email is required';
    if (!formData.otp) tempErrors.otp = 'OTP is required';
    if (!formData.newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!validate()) {
      showToast('Validation failed. Please correct form fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(
        formData.email,
        formData.otp,
        formData.newPassword,
        formData.confirmPassword
      );

      if (res.success) {
        setApiSuccess('Password reset successfully. Redirecting to login...');
        showToast('Password reset successfully! You can now log in.', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errMsg = res.message || 'Password reset failed.';
        setApiError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error occurred while resetting password.';
      setApiError(errMsg);
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

      <div className="w-100 auth-page-transition d-flex flex-column align-items-center" style={{ maxWidth: '460px', zIndex: 10 }}>
        <div className="text-center mb-4">
          <BrandLogo width={64} height={64} className="mb-2" />
          <h2 className="fw-bold mt-2 text-white" style={{ letterSpacing: '-0.5px' }}>Reset Password</h2>
          <p className="text-muted small fw-medium">Set a new password for your account</p>
        </div>

        <Card className="auth-card" title="Update Credentials">
          {apiError && <div className="alert alert-danger small py-2 bg-danger-subtle border-danger text-danger-emphasis">{apiError}</div>}
          {apiSuccess && <div className="alert alert-success small py-2 bg-success-subtle border-success text-success-emphasis">{apiSuccess}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="name@email.com"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Enter OTP Code</label>
              <input
                type="text"
                name="otp"
                className={`form-control text-center fw-bold ${errors.otp ? 'is-invalid' : ''}`}
                value={formData.otp}
                onChange={handleChange}
                maxLength="6"
                placeholder="• • • • • •"
                style={{ letterSpacing: '0.3em', fontSize: '1.1rem' }}
              />
              {errors.otp && <div className="invalid-feedback">{errors.otp}</div>}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="At least 6 chars"
                />
                {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-3 d-flex align-items-center justify-content-center" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Updating Credentials...
                </>
              ) : 'Save New Password'}
            </button>
          </form>

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
              <span>Secure Setup | 256-bit SSL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
