import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!formData.password)     errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setSubmitting(true);
    const res = await adminLogin(formData.email, formData.password);
    setSubmitting(false);
    if (res.success) {
      showToast('Admin access granted. Welcome.', 'success');
      navigate('/admin/dashboard');
    } else {
      const msg = res.message || 'Invalid administrator credentials';
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
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <BrandLogo width={40} height={40} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              GrowStar
            </span>
          </div>
          <div>
            <span className="admin-badge" style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#f3e5ab',
              padding: '0.25rem 0.625rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <i className="bi bi-shield-lock-fill" style={{ color: '#d4af37' }}></i>
              Admin Console
            </span>
          </div>
        </div>

        {/* Centered Glassmorphic Card */}
        <div className="auth-card-dark w-100">
          <div className="mb-4">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Portal Management
            </h3>
            <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.8125rem' }}>
              Administrator access only
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
            {/* Email Field */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Admin Email</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="admin@growstar.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
              {errors.email && (
                <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-icon-wrapper has-right-icon">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
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
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-lock"></i>
                  Login to Console
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p style={{ marginTop: '1.5rem', color: 'rgba(148, 163, 184, 0.45)', fontSize: '0.75rem', textAlign: 'center' }}>
          Restricted access. Unauthorised attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
