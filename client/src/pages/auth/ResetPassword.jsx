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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!formData.email)           errs.email = 'Email is required';
    if (!formData.otp)             errs.otp = 'OTP is required';
    if (!formData.newPassword)     errs.newPassword = 'New password is required';
    else if (formData.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (formData.newPassword !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) {
      showToast('Please correct the form errors.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resetPassword(
        formData.email, formData.otp, formData.newPassword, formData.confirmPassword
      );
      if (res.success) {
        setSuccess(true);
        showToast('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const msg = res.message || 'Password reset failed.';
        setApiError(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error while resetting password.';
      setApiError(msg);
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
          {success ? (
            <div className="text-center py-2 animate-fade">
              <div className="success-circle" style={{ margin: '0 auto 1.25rem' }}>
                <i className="bi bi-shield-check" style={{ fontSize: '2.25rem', color: '#34d399' }}></i>
              </div>
              <h5 style={{ color: '#34d399', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Password Updated!</h5>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.875rem' }}>
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-center">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Set New Password
                </h3>
                <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.8125rem' }}>
                  Enter the OTP and your new password
                </p>
              </div>

              {apiError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
                  <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Email Field */}
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-envelope input-icon"></i>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="name@email.com"
                      value={formData.email}
                      onChange={handleChange}
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
                  <label className="form-label">OTP Code</label>
                  <input
                    type="text"
                    name="otp"
                    className={`form-control text-center fw-bold ${errors.otp ? 'is-invalid' : ''}`}
                    placeholder="• • • • • •"
                    maxLength="6"
                    value={formData.otp}
                    onChange={handleChange}
                    style={{ letterSpacing: '0.4em', fontSize: '1.1rem' }}
                  />
                  {errors.otp && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.otp}
                    </div>
                  )}
                </div>

                {/* Passwords */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label">New Password</label>
                    <div className="input-icon-wrapper has-right-icon">
                      <i className="bi bi-lock input-icon"></i>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="newPassword"
                        className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                        placeholder="Min 6 chars"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                      <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                        <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    {errors.newPassword && (
                      <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.73rem' }}>
                        {errors.newPassword}
                      </div>
                    )}
                  </div>
                  <div className="col-6">
                    <label className="form-label">Confirm</label>
                    <div className="input-icon-wrapper has-right-icon">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        name="confirmPassword"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Re-enter"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button type="button" className="input-icon-right" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                        <i className={`bi ${showConfirmPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.73rem' }}>
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock-fill"></i>
                      Save New Password
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
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
