import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

    if (!validate()) return;

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
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setApiError(res.message || 'Password reset failed.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error occurred while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="w-100 animate-fade" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <BrandLogo width={48} height={48} className="mb-2" />
          <h2 className="fw-bold mt-2 text-primary" style={{ letterSpacing: '-0.5px' }}>Reset Password</h2>
          <p className="text-secondary small fw-medium">Set a new password for your account</p>
        </div>

        <Card title="Update Credentials">
          {apiError && <div className="alert alert-danger small py-2">{apiError}</div>}
          {apiSuccess && <div className="alert alert-success small py-2">{apiSuccess}</div>}

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
                className={`form-control ${errors.otp ? 'is-invalid' : ''}`}
                value={formData.otp}
                onChange={handleChange}
                maxLength="6"
                placeholder="6-digit code"
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
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-3" disabled={loading}>
              {loading ? 'Updating Credentials...' : 'Save New Password'}
            </button>
          </form>

          <hr className="my-4 text-secondary" />
          <div className="text-center">
            <Link to="/login" className="text-primary small fw-semibold text-decoration-none">
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
