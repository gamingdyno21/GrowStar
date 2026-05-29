import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from route state if redirecting from somewhere, otherwise empty
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.verifyOTP(email, otp);
      if (res.success) {
        setApiSuccess('Verification successful! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setApiError('Invalid or expired OTP code.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors({ email: 'Enter your email address first' });
      return;
    }
    setApiError('');
    setApiSuccess('');
    try {
      await authService.requestOTP(email);
      setApiSuccess('A new OTP has been sent. Check your logs!');
    } catch (err) {
      setApiError('Failed to send OTP.');
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="w-100 animate-fade" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <BrandLogo width={48} height={48} className="mb-2" />
          <h2 className="fw-bold mt-2 text-primary" style={{ letterSpacing: '-0.5px' }}>OTP Verification</h2>
          <p className="text-secondary small fw-medium">Verify your email address</p>
        </div>

        <Card title="Enter 6-Digit OTP">
          {apiError && <div className="alert alert-danger small py-2">{apiError}</div>}
          {apiSuccess && <div className="alert alert-success small py-2">{apiSuccess}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                placeholder="name@email.com"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Verification Code (OTP)</label>
              <input
                type="text"
                className={`form-control ${errors.otp ? 'is-invalid' : ''}`}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrors({});
                }}
                maxLength="6"
                placeholder="Enter 6-digit OTP"
              />
              {errors.otp && <div className="invalid-feedback">{errors.otp}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-3" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center mt-3">
            <button type="button" className="btn btn-link text-decoration-none btn-sm" onClick={handleResend}>
              Resend OTP code
            </button>
          </div>

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

export default VerifyOTP;
