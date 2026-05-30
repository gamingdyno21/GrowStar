import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Card from '../../components/common/Card';
import BrandLogo from '../../components/common/BrandLogo';
import { formatPAN, formatAadhaar, formatPhone } from '../../utils/helpers';
import { REGEX_PATTERNS } from '../../utils/constants';
const RESEND_COOLDOWN = 60; // seconds

// ─── OTP Status Message ───────────────────────────────────────────────────────
const OtpStatusMessage = ({ status }) => {
  if (!status?.message) return null;
  const map = {
    success: { cls: 'alert-success', icon: 'bi-check-circle-fill'      },
    error:   { cls: 'alert-danger',  icon: 'bi-exclamation-circle-fill' },
    info:    { cls: 'alert-info',    icon: 'bi-info-circle-fill'        },
  };
  const { cls, icon } = map[status.type] || { cls: 'alert-secondary', icon: 'bi-info-circle' };
  return (
    <div className={`alert ${cls} py-1 px-2 d-flex align-items-center gap-2 mb-0 mt-2`}
         style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
      <i className={`bi ${icon}`} />
      <span>{status.message}</span>
    </div>
  );
};

// ─── Verified / Pending Badge ─────────────────────────────────────────────────
const VerifBadge = ({ verified }) =>
  verified
    ? <span className="badge bg-success"><i className="bi bi-patch-check-fill me-1" />Verified</span>
    : <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1" />Pending</span>;

// ─────────────────────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();

  // ── Stepper ──────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Form Data ────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', address: '',
    panNumber: '', aadhaarNumber: '',
    emailOtp: '', phoneOtp: '',
    password: '', confirmPassword: '',
  });

  // ── Verification Flags ───────────────────────────────────────────────────────
  const [emailVerified, setEmailVerified] = useState(() => {
    return localStorage.getItem('emailVerified') === 'true';
  });
  const [phoneVerified, setPhoneVerified] = useState(() => {
    return localStorage.getItem('mobileValidated') === 'true';
  });

  // ── Per-field OTP Status Messages ────────────────────────────────────────────
  const [emailOtpStatus, setEmailOtpStatus] = useState({ type: '', message: '' });

  // ── Resend Cooldown Timers ───────────────────────────────────────────────────
  const [emailCooldown, setEmailCooldown] = useState(0);
  const emailTimerRef = useRef(null);

  // ── Loading States ───────────────────────────────────────────────────────────
  const [generatingOtp,  setGeneratingOtp]  = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);

  // ── Page-level messages ──────────────────────────────────────────────────────
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  // ── Instant Phone Validation ─────────────────────────────────────────────────
  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.phoneNumber);
  useEffect(() => {
    setPhoneVerified(isPhoneValid);
    localStorage.setItem('mobileValidated', isPhoneValid ? 'true' : 'false');
  }, [formData.phoneNumber, isPhoneValid]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (emailTimerRef.current) clearInterval(emailTimerRef.current);
    };
  }, []);

  // ─── Cooldown timer ──────────────────────────────────────────────────────────
  const startCooldown = () => {
    if (emailTimerRef.current) clearInterval(emailTimerRef.current);
    setEmailCooldown(RESEND_COOLDOWN);
    emailTimerRef.current = setInterval(() => {
      setEmailCooldown(prev => {
        if (prev <= 1) { clearInterval(emailTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Form field change ───────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'panNumber')     v = formatPAN(value);
    if (name === 'aadhaarNumber') v = formatAadhaar(value);
    if (name === 'phoneNumber')   v = formatPhone(value);
    if (name === 'email') {
      v = value.toLowerCase().trim();
      setEmailVerified(false);
      localStorage.setItem('emailVerified', 'false');
    }
    setFormData({ ...formData, [name]: v });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // ─── Step 1 validation ───────────────────────────────────────────────────────
  const validateDetails = () => {
    const errs = {};
    if (!formData.fullName.trim())       errs.fullName      = 'Full name is required';
    if (!formData.email.trim())          errs.email         = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email address';
    if (!formData.phoneNumber.trim())    errs.phoneNumber   = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) errs.phoneNumber = 'Must be a valid 10-digit Indian mobile number';
    if (!formData.address.trim())        errs.address       = 'Residential address is required';
    if (!formData.panNumber.trim())      errs.panNumber     = 'PAN Number is required';
    else if (!REGEX_PATTERNS.PAN.test(formData.panNumber)) errs.panNumber = 'Invalid PAN (e.g. ABCDE1234F)';
    if (!formData.aadhaarNumber.trim())  errs.aadhaarNumber = 'Aadhaar Number is required';
    else if (!REGEX_PATTERNS.AADHAAR.test(formData.aadhaarNumber)) errs.aadhaarNumber = 'Must be exactly 12 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Generate OTPs: Email → backend ────────────────────────
  const handleGenerateOTPs = async () => {
    setApiError('');
    if (!validateDetails()) {
      setApiError('Please correct all errors above before sending verification code.');
      return;
    }
    setGeneratingOtp(true);
    setEmailOtpStatus({ type: '', message: '' });

    let emailSent = false;

    // ── Email OTP via backend (Nodemailer / Gmail SMTP) ──
    try {
      const resEmail = await authService.resendOTP(formData.email, null);
      if (resEmail?.success) {
        emailSent = true;
        setEmailOtpStatus({ type: 'info', message: `OTP sent to ${formData.email}. Check your inbox.` });
        startCooldown();
      } else {
        setEmailOtpStatus({ type: 'error', message: 'Failed to send email OTP. Please retry.' });
      }
    } catch (err) {
      setEmailOtpStatus({ type: 'error', message: err.response?.data?.message || 'Email OTP dispatch failed.' });
    }

    setGeneratingOtp(false);

    if (emailSent) {
      setCurrentStep(2);
    } else {
      setApiError('Failed to send verification code. Please check your details and retry.');
    }
  };

  // ─── Resend Email OTP ─────────────────────────────────────────────────────────
  const handleResendEmailOtp = async () => {
    if (emailCooldown > 0 || resendingEmail || emailVerified) return;
    setResendingEmail(true);
    setEmailOtpStatus({ type: '', message: '' });
    try {
      const res = await authService.resendOTP(formData.email, null);
      if (res?.success) {
        setEmailVerified(false);
        setFormData(prev => ({ ...prev, emailOtp: '' }));
        setEmailOtpStatus({ type: 'info', message: `New OTP sent to ${formData.email}.` });
        startCooldown();
      } else {
        setEmailOtpStatus({ type: 'error', message: 'Failed to resend OTP. Please try again.' });
      }
    } catch (err) {
      setEmailOtpStatus({ type: 'error', message: err.response?.data?.message || 'Failed to resend email OTP.' });
    } finally {
      setResendingEmail(false);
    }
  };

  // ─── Verify Email OTP (backend) ───────────────────────────────────────────────
  const handleVerifyEmailOtp = async () => {
    if (!formData.emailOtp.trim()) {
      setEmailOtpStatus({ type: 'error', message: 'Please enter the OTP from your email.' });
      return;
    }
    setVerifyingEmail(true);
    setEmailOtpStatus({ type: '', message: '' });
    setEmailVerified(false); // Reset verification state
    localStorage.setItem('emailVerified', 'false');
    try {
      const res = await authService.verifyOTP(formData.email, formData.emailOtp.trim());
      console.log("[DEBUG] Email verification response:", res);
      if (res?.success) {
        setEmailVerified(true);
        localStorage.setItem('emailVerified', 'true');
        setEmailOtpStatus({ type: 'success', message: 'Email address verified successfully.' });
      } else {
        setEmailVerified(false); // Clear on failure
        localStorage.setItem('emailVerified', 'false');
        setEmailOtpStatus({ type: 'error', message: 'Invalid OTP. Please check and try again.' });
      }
    } catch (err) {
      console.error("[DEBUG] Email verification failed:", err);
      setEmailVerified(false); // Clear on exception
      localStorage.setItem('emailVerified', 'false');
      const msg = err.response?.data?.message || '';
      setEmailOtpStatus({
        type: 'error',
        message: msg.toLowerCase().includes('expired')
          ? 'OTP has expired. Click "Resend OTP" to get a new one.'
          : 'Invalid OTP. Please check and try again.',
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // ─── Proceed to Password ─────────────────────────────────────────────────────
  const handleProceedToPasswords = () => {
    const isEmailVerifiedStored = localStorage.getItem('emailVerified') === 'true';
    const isMobileValidatedStored = localStorage.getItem('mobileValidated') === 'true';

    setEmailVerified(isEmailVerifiedStored);
    setPhoneVerified(isMobileValidatedStored);

    if (isEmailVerifiedStored && isMobileValidatedStored) {
      setCurrentStep(3);
      setApiError('');
    } else {
      setApiError('Verification is incomplete. Please complete email and mobile validation.');
    }
  };

  // ─── Final Registration ──────────────────────────────────────────────────────
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = {};
    if (!formData.password)                              errs.password        = 'Password is required';
    else if (formData.password.length < 6)               errs.password        = 'Must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)  errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const isEmailVerifiedStored = localStorage.getItem('emailVerified') === 'true';
    const isMobileValidatedStored = localStorage.getItem('mobileValidated') === 'true';

    const payload = {
      fullName:        formData.fullName,
      email:           formData.email,
      phone:           formData.phoneNumber,
      phoneNumber:     formData.phoneNumber,
      address:         formData.address,
      panNumber:       formData.panNumber,
      aadhaarNumber:   formData.aadhaarNumber,
      password:        formData.password,
      confirmPassword: formData.confirmPassword,
      emailOtp:        formData.emailOtp,
      emailVerified:   isEmailVerifiedStored,
      mobileValidated: isMobileValidatedStored,
    };

    console.log("Final signup payload", payload);
    console.log("Submitting phone:", formData.phoneNumber);

    setSubmitting(true);
    try {
      const res = await authService.signup(payload);

      if (res?.success) {
        localStorage.removeItem('emailVerified');
        localStorage.removeItem('mobileValidated');
        setCurrentStep(4);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setApiError(res?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Stepper labels ──────────────────────────────────────────────────────────
  const STEPS = ['Client Details', 'OTP Verification', 'Password Setup', 'Account Created'];

  // ─────────────────────────────────────────────────────────────────────────────
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

      <div className="w-100 auth-page-transition d-flex flex-column align-items-center" style={{ maxWidth: '660px', zIndex: 10 }}>

        {/* Brand Header */}
        <div className="text-center mb-4">
          <BrandLogo width={64} height={64} className="mb-2" />
          <h2 className="fw-bold mt-2 text-white" style={{ letterSpacing: '-0.5px' }}>GrowStar</h2>
          <p className="text-muted small fw-medium">Grow Smarter. Invest Stronger.</p>
        </div>

        {/* ── Progress Stepper ── */}
        <div className="finance-card auth-card p-4 mb-4 text-center w-100" style={{ maxWidth: '660px' }}>
          <div className="signup-stepper">
            {STEPS.map((label, idx) => {
              const n = idx + 1;
              const done = currentStep > n, active = currentStep === n;
              return (
                <div key={label}
                  className="text-center position-relative d-flex flex-column align-items-center"
                  style={{ zIndex: 1, width: '80px' }}>
                  <div className={`step-indicator ${done ? 'completed' : active ? 'active' : ''}`}>
                    {done ? <i className="bi bi-check-lg" /> : n}
                  </div>
                  <span className="mt-2 text-muted fw-semibold text-center"
                    style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.4px', lineHeight: 1.3 }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="auth-card" title={currentStep === 4 ? 'Registration Successful' : 'New Client Registration'}>
          {apiError && <div className="alert alert-danger small py-2 mb-3 bg-danger-subtle border-danger text-danger-emphasis">{apiError}</div>}

          {/* ════════════ STEP 1: Client Details ════════════ */}
          {currentStep === 1 && (
            <div className="animate-fade">
              <div className="mb-3">
                <label className="form-label">Full Name <span className="text-danger">*</span></label>
                <input type="text" name="fullName"
                  className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                  placeholder="As per official documents"
                  value={formData.fullName} onChange={handleChange} />
                {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email Address <span className="text-danger">*</span></label>
                  <input type="email" name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="e.g. name@email.com"
                    value={formData.email} onChange={handleChange} />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Mobile Number <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary small bg-dark-subtle border-secondary border-opacity-25" style={{ color: '#94a3b8 !important' }}>+91</span>
                    <input type="text" name="phoneNumber"
                      className={`form-control ${errors.phoneNumber ? 'is-invalid' : isPhoneValid ? 'is-valid' : ''}`}
                      placeholder="10-digit number"
                      value={formData.phoneNumber} onChange={handleChange} />
                    {isPhoneValid && (
                      <div className="valid-feedback text-success small w-100 mt-1" style={{ display: 'block' }}>
                        ✓ Valid Indian mobile number
                      </div>
                    )}
                    {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Residential Address <span className="text-danger">*</span></label>
                <textarea name="address" rows="2"
                  className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  placeholder="Street address, City, State, ZIP"
                  value={formData.address} onChange={handleChange} />
                {errors.address && <div className="invalid-feedback">{errors.address}</div>}
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label">PAN Card Number <span className="text-danger">*</span></label>
                  <input type="text" name="panNumber"
                    className={`form-control ${errors.panNumber ? 'is-invalid' : ''}`}
                    placeholder="ABCDE1234F"
                    value={formData.panNumber} onChange={handleChange} />
                  {errors.panNumber && <div className="invalid-feedback">{errors.panNumber}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Aadhaar Number <span className="text-danger">*</span></label>
                  <input type="text" name="aadhaarNumber"
                    className={`form-control ${errors.aadhaarNumber ? 'is-invalid' : ''}`}
                    placeholder="12-digit Aadhaar"
                    value={formData.aadhaarNumber} onChange={handleChange} />
                  {errors.aadhaarNumber && <div className="invalid-feedback">{errors.aadhaarNumber}</div>}
                </div>
              </div>

              <button type="button" className="btn btn-primary w-100 py-2.5"
                onClick={handleGenerateOTPs} disabled={generatingOtp}>
                {generatingOtp
                  ? <><span className="spinner-border spinner-border-sm me-2" />Sending Verification Code...</>
                  : <><i className="bi bi-shield-lock me-2" />Send Verification OTP</>}
              </button>
            </div>
          )}

          {/* ════════════ STEP 2: OTP Verification & Validation ════════════ */}
          {currentStep === 2 && (
            <div className="animate-fade">
              <div className="alert alert-primary py-2 mb-4 d-flex align-items-center gap-2 small bg-primary-subtle border-primary text-primary-emphasis">
                <i className="bi bi-shield-exclamation fs-5" />
                <span>
                  Verify your <strong>email address</strong> via OTP. Your mobile number has been pre-validated.
                </span>
              </div>

              <div className="row g-3 mb-4">

                {/* ── Phone Validation Panel ── */}
                <div className="col-md-6">
                  <div className="rounded-3 p-3 h-100 d-flex flex-column justify-content-between"
                    style={{ background: 'rgba(25, 135, 84, 0.12)', border: '1px solid rgba(25, 135, 84, 0.25)', transition: 'all 0.3s' }}>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold small text-success d-flex align-items-center gap-1">
                          <i className="bi bi-phone" /> Mobile
                        </span>
                        <span className="badge bg-success">
                          <i className="bi bi-patch-check-fill me-1" />Validated
                        </span>
                      </div>

                      <p className="text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                        Mobile Number: <strong>+91 {formData.phoneNumber}</strong>
                      </p>
                      
                      <div className="alert alert-success py-2 px-2 d-flex align-items-center gap-2 mb-0 mt-3"
                           style={{ fontSize: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(25, 135, 84, 0.15)', color: '#a3cfbb', borderColor: 'rgba(25, 135, 84, 0.2)' }}>
                        <i className="bi bi-check-circle-fill" />
                        <span>Validated</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Email OTP Panel (Backend) ── */}
                <div className="col-md-6">
                  <div className="rounded-3 p-3 h-100"
                    style={{ 
                      background: emailVerified ? 'rgba(25, 135, 84, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: emailVerified ? '1px solid rgba(25, 135, 84, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.3s' 
                    }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-semibold small text-primary d-flex align-items-center gap-1" style={{ color: '#D4AF37 !important' }}>
                        <i className="bi bi-envelope-at" /> Email OTP
                      </span>
                      <VerifBadge verified={emailVerified} />
                    </div>

                    <p className="text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                      Sent to <strong>{formData.email}</strong>
                    </p>

                    <input type="text" name="emailOtp"
                      className={`form-control form-control-sm text-center fw-bold ${
                        emailOtpStatus.type === 'error' ? 'is-invalid' : emailVerified ? 'is-valid' : ''}`}
                      placeholder="• • • • • •"
                      maxLength="6"
                      disabled={emailVerified}
                      value={formData.emailOtp}
                      onChange={handleChange}
                      style={{ letterSpacing: '0.3em', fontSize: '1rem' }}
                    />
                    <OtpStatusMessage status={emailOtpStatus} />

                    <button type="button"
                      className={`btn btn-sm w-100 mt-2 ${emailVerified ? 'btn-success text-white' : 'btn-primary'}`}
                      onClick={handleVerifyEmailOtp}
                      disabled={emailVerified || verifyingEmail}>
                      {verifyingEmail
                        ? <><span className="spinner-border spinner-border-sm me-1" />Verifying...</>
                        : emailVerified
                          ? <><i className="bi bi-check-lg me-1" />Verified</>
                          : 'Verify Email OTP'}
                    </button>

                    {!emailVerified && (
                      <button type="button"
                        className="btn btn-link btn-sm text-muted p-0 mt-2 w-100"
                        onClick={handleResendEmailOtp}
                        disabled={emailCooldown > 0 || resendingEmail}
                        style={{ fontSize: '0.72rem', textDecoration: 'none' }}>
                        {resendingEmail
                          ? <><span className="spinner-border spinner-border-sm me-1" />Resending...</>
                          : emailCooldown > 0
                            ? <><i className="bi bi-clock me-1" />Resend in {emailCooldown}s</>
                            : <><i className="bi bi-arrow-counterclockwise me-1" />Resend OTP</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Verification Status Bar ── */}
              <div className="rounded-3 p-3 mb-4 small d-flex align-items-center gap-4"
                style={{
                  background: emailVerified ? 'rgba(25, 135, 84, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: emailVerified ? '1px solid rgba(25, 135, 84, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: emailVerified ? '#a3cfbb' : '#94a3b8'
                }}>
                <span>
                  <i className="bi bi-check-circle-fill text-success me-1" />
                  Mobile (Validated)
                </span>
                <span>
                  <i className={`bi ${emailVerified ? 'bi-check-circle-fill text-success' : 'bi-circle'} me-1`} />
                  Email (OTP)
                </span>
                {emailVerified
                  ? <span className="ms-auto fw-semibold text-success"><i className="bi bi-shield-check me-1" />Ready to proceed</span>
                  : <span className="ms-auto" style={{ fontSize: '0.72rem' }}>Verify email to continue</span>}
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary w-50"
                  onClick={() => setCurrentStep(1)}>
                  <i className="bi bi-arrow-left me-1" />Back
                </button>
                <button type="button" className="btn btn-primary w-50"
                  onClick={handleProceedToPasswords}
                  disabled={!emailVerified}>
                  {emailVerified
                    ? <><i className="bi bi-lock me-1" />Set Password</>
                    : 'Verify Email OTP First'}
                </button>
              </div>
            </div>
          )}

          {/* ════════════ STEP 3: Password Setup ════════════ */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmitRegistration} className="animate-fade">
              {emailVerified && phoneVerified ? (
                <div className="alert alert-success py-2 small mb-4 d-flex align-items-center gap-2 bg-success-subtle border-success text-success-emphasis">
                  <i className="bi bi-shield-check" />
                  <span>Both mobile and email verified. Create your secure login password below.</span>
                </div>
              ) : (
                <div className="alert alert-danger py-2 small mb-4 d-flex align-items-center gap-2 bg-danger-subtle border-danger text-danger-emphasis">
                  <i className="bi bi-exclamation-triangle" />
                  <span>Verification is incomplete. Please complete email and mobile validation.</span>
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Set Password <span className="text-danger">*</span></label>
                  <input type="password" name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Minimum 6 characters"
                    value={formData.password} onChange={handleChange} />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                  <input type="password" name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword} onChange={handleChange} />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>
              </div>

              <div className="d-flex gap-2 mt-4 pt-2 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08) !important' }}>
                <button type="button" className="btn btn-outline-primary w-50"
                  onClick={() => setCurrentStep(2)}>
                  <i className="bi bi-arrow-left me-1" />Back
                </button>
                <button type="submit" className="btn btn-primary w-50"
                  disabled={submitting || !emailVerified || !phoneVerified || !formData.password || formData.password !== formData.confirmPassword}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Creating Account...</>
                    : <><i className="bi bi-person-check me-2" />Create Account</>}
                </button>
              </div>
            </form>
          )}

          {/* ════════════ STEP 4: Success ════════════ */}
          {currentStep === 4 && (
            <div className="text-center py-4 animate-fade">
              <div className="d-inline-flex p-4 rounded-circle mb-4" style={{ background: 'rgba(25, 135, 84, 0.15)', border: '1px solid rgba(25, 135, 84, 0.3)', color: '#a3cfbb' }}>
                <i className="bi bi-shield-check" style={{ fontSize: '3rem' }} />
              </div>
              <h3 className="fw-bold text-success" style={{ background: 'none', WebkitTextFillColor: 'initial', color: '#198754 !important' }}>Account Created!</h3>
              <p className="text-muted mt-2 px-md-5">
                Your GrowStar account has been created and fully verified.
                Redirecting to the login page...
              </p>
              <div className="mt-4">
                <Link to="/login" className="btn btn-primary px-5">
                  <i className="bi bi-box-arrow-in-right me-2" />Proceed to Login
                </Link>
              </div>
            </div>
          )}

          {currentStep !== 4 && (
            <>
              <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <div className="text-center small">
                <span className="text-muted">Already have an account? </span>
                <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: '#D4AF37' }}>Sign in here</Link>
              </div>
            </>
          )}

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

export default Signup;
