import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginIdentifier: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.loginIdentifier.trim()) {
      tempErrors.loginIdentifier = 'Email or phone number is required';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    const res = await login(formData.loginIdentifier, formData.password);
    setSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setApiError(res.message || 'Invalid credentials');
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
          <h2 className="fw-bold mt-2 text-white" style={{ letterSpacing: '-0.5px' }}>GrowStar</h2>
          <p className="text-muted small fw-medium">Grow Smarter. Invest Stronger.</p>
        </div>

        <Card className="auth-card" title="Client Portal Sign In">
          {apiError && <div className="alert alert-danger small py-2 bg-danger-subtle border-danger text-danger-emphasis">{apiError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginIdentifier" className="form-label">
                Email Address or Phone
              </label>
              <input
                type="text"
                id="loginIdentifier"
                name="loginIdentifier"
                className={`form-control ${errors.loginIdentifier ? 'is-invalid' : ''}`}
                placeholder="e.g. user@email.com or 9876543210"
                value={formData.loginIdentifier}
                onChange={handleChange}
              />
              {errors.loginIdentifier && (
                <div className="invalid-feedback">{errors.loginIdentifier}</div>
              )}
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label htmlFor="password" className="form-label mb-0">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="small text-decoration-none fw-semibold"
                  style={{ color: '#D4AF37' }}
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-3" disabled={submitting}>
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <div className="text-center">
            <span className="text-muted small d-block mb-2">New to GrowStar?</span>
            <Link to="/signup" className="btn btn-outline-primary w-100 py-2.5">
              Create Account
            </Link>
          </div>

          {/* Trust Badge Indicator */}
          <div className="text-center mt-4">
            <div className="auth-trust-badge">
              <i className="bi bi-shield-fill-check"></i>
              <span>Secure Client Portal | 256-bit SSL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
