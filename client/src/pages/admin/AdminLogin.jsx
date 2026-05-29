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
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="w-100 animate-fade" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <BrandLogo width={48} height={48} className="mb-2" />
          <h2 className="fw-bold mt-2 text-primary" style={{ letterSpacing: '-0.5px' }}>GrowStar</h2>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded text-uppercase tracking-wider small fw-semibold">Admin Console</span>
        </div>

        <Card title="Portal Management Login">
          {apiError && <div className="alert alert-danger small py-2">{apiError}</div>}

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
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
