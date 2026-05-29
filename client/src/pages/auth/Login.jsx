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
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="w-100 animate-fade" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <BrandLogo width={48} height={48} className="mb-2" />
          <h2 className="fw-bold mt-2 text-primary" style={{ letterSpacing: '-0.5px' }}>GrowStar</h2>
          <p className="text-secondary small fw-medium">Grow Smarter. Invest Stronger.</p>
        </div>

        <Card title="Client Portal Sign In">
          {apiError && <div className="alert alert-danger small py-2">{apiError}</div>}

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
                  className="text-primary small text-decoration-none fw-semibold"
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
          <hr className="my-4 text-secondary" />
          <div className="text-center">
            <span className="text-secondary small d-block mb-2">New to GrowStar?</span>
            <Link to="/signup" className="btn btn-outline-primary w-100 py-2.5">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
