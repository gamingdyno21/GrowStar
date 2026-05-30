import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
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
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
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
    const res = await adminLogin(formData.email, formData.password);
    setSubmitting(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setApiError(res.message || 'Invalid administrator credentials');
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
          <span className="badge px-3 py-1.5 rounded text-uppercase tracking-wider small fw-semibold"
            style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#D4AF37' }}>
            Admin Console
          </span>
        </div>

        <Card className="auth-card" title="Portal Management Login">
          {apiError && <div className="alert alert-danger small py-2 bg-danger-subtle border-danger text-danger-emphasis">{apiError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Admin Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="admin@growstar.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Admin Password
              </label>
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
              {submitting ? 'Entering Workspace...' : 'Login'}
            </button>
          </form>

          {/* Secure Console Badge Indicator */}
          <div className="text-center mt-4">
            <div className="auth-trust-badge" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              <i className="bi bi-shield-fill-check" style={{ color: '#D4AF37' }}></i>
              <span style={{ color: '#a3b1c6' }}>Secure Operator Console | 256-bit SSL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
