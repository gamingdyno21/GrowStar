import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestOTP(email);
      if (res.success) {
        // Redirect to Reset Password with email state
        navigate('/reset-password', { state: { email } });
      } else {
        setError(res.message || 'Failed to send OTP. Please check email address.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="w-100 animate-fade" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <BrandLogo width={48} height={48} className="mb-2" />
          <h2 className="fw-bold mt-2 text-primary" style={{ letterSpacing: '-0.5px' }}>Password Recovery</h2>
          <p className="text-secondary small fw-medium">Verify ownership of your account</p>
        </div>

        <Card title="Forgot Password">
          {error && <div className="alert alert-danger small py-2">{error}</div>}

          <p className="text-secondary small mb-4">
            Enter the email address registered to your account. We will dispatch a 6-digit OTP code to verify your identity.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 mt-2" disabled={loading}>
              {loading ? 'Generating OTP...' : 'Send Verification OTP'}
            </button>
          </form>

          <hr className="my-4 text-secondary" />
          <div className="text-center">
            <Link to="/login" className="text-primary small fw-semibold text-decoration-none">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
