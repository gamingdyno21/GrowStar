import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.loginIdentifier.trim()) errs.loginIdentifier = 'Email or phone number is required';
    if (!formData.password)               errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setSubmitting(true);
    const res = await login(formData.loginIdentifier, formData.password);
    setSubmitting(false);
    if (res.success) {
      showToast('Welcome back! Login successful.', 'success');
      navigate('/dashboard');
    } else {
      const msg = res.message || 'Invalid credentials. Please try again.';
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

      <div className="auth-page-transition">
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
        <div className="auth-card-dark">
          {/* Card Header */}
          <div className="text-center mb-4">
            <h3 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Welcome back
            </h3>
            <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.8125rem' }}>
              Sign in to access your investment portfolio
            </p>
          </div>

          {/* Error Alert */}
          {apiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email / Phone Field */}
            <div className="mb-3">
              <label htmlFor="loginIdentifier" className="form-label">Email or Phone</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-person input-icon"></i>
                <input
                  type="text"
                  id="loginIdentifier"
                  name="loginIdentifier"
                  className={`form-control ${errors.loginIdentifier ? 'is-invalid' : ''}`}
                  placeholder="user@email.com or 9876543210"
                  value={formData.loginIdentifier}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
              {errors.loginIdentifier && (
                <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                  {errors.loginIdentifier}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="password" className="form-label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.8125rem', color: '#d4af37', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrapper has-right-icon">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                  {errors.password}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100"
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
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* New to GrowStar Signup Divider */}
          <div className="d-flex align-items-center gap-3 my-4">
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.5)', fontWeight: 500 }}>New to GrowStar?</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          </div>

          {/* Create Account Button */}
          <Link
            to="/signup"
            className="btn btn-outline-primary w-100 text-center"
            style={{ fontWeight: 600 }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
