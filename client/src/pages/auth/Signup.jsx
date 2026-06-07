import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import BrandLogo from '../../components/common/BrandLogo';
import { formatPAN, formatAadhaar, formatPhone } from '../../utils/helpers';
import { REGEX_PATTERNS } from '../../utils/constants';

const RESEND_COOLDOWN = 60;

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

// ── OTP Status Message ──────────────────────────────────────
const OtpStatusMessage = ({ status }) => {
  if (!status?.message) return null;
  const map = {
    success: { bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)', color: '#34d399', icon: 'bi-check-circle-fill' },
    error:   { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', icon: 'bi-exclamation-circle-fill' },
    info:    { bg: 'rgba(59, 130, 246, 0.1)',  border: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', icon: 'bi-info-circle-fill' },
  };
  const s = map[status.type] || map.info;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: '8px', padding: '0.625rem 0.75rem', fontSize: '0.78rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.625rem' }}>
      <i className={`bi ${s.icon} flex-shrink-0`}></i>
      <span>{status.message}</span>
    </div>
  );
};

// ── Signup Component ────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', address: '',
    panNumber: '', aadhaarNumber: '',
    emailOtp: '', phoneOtp: '',
    password: '', confirmPassword: '',
  });

  const [emailVerified, setEmailVerified] = useState(() => localStorage.getItem('emailVerified') === 'true');
  const [phoneVerified, setPhoneVerified] = useState(() => localStorage.getItem('mobileValidated') === 'true');
  const [emailOtpStatus, setEmailOtpStatus] = useState({ type: '', message: '' });
  const [emailCooldown, setEmailCooldown] = useState(0);
  const emailTimerRef = useRef(null);

  const [generatingOtp,  setGeneratingOtp]  = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.phoneNumber);
  useEffect(() => {
    setPhoneVerified(isPhoneValid);
    localStorage.setItem('mobileValidated', isPhoneValid ? 'true' : 'false');
  }, [formData.phoneNumber, isPhoneValid]);

  useEffect(() => {
    return () => { if (emailTimerRef.current) clearInterval(emailTimerRef.current); };
  }, []);

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

  const handleGenerateOTPs = async () => {
    setApiError('');
    if (!validateDetails()) {
      setApiError('Please correct all errors above before sending verification code.');
      showToast('Validation failed. Please correct form fields.', 'error');
      return;
    }
    setGeneratingOtp(true);
    setEmailOtpStatus({ type: '', message: '' });
    let emailSent = false;
    try {
      const resEmail = await authService.resendOTP(formData.email, null);
      if (resEmail?.success) {
        emailSent = true;
        setEmailOtpStatus({ type: 'info', message: `OTP sent to ${formData.email}. Check your inbox.` });
        showToast(`Verification OTP sent to ${formData.email}`, 'success');
        startCooldown();
      } else {
        setEmailOtpStatus({ type: 'error', message: 'Failed to send email OTP. Please retry.' });
        showToast('Failed to send email OTP. Please retry.', 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Email OTP dispatch failed.';
      setEmailOtpStatus({ type: 'error', message: errMsg });
      showToast(errMsg, 'error');
    }
    setGeneratingOtp(false);
    if (emailSent) {
      setCurrentStep(2);
    } else {
      setApiError('Failed to send verification code. Please check your details and retry.');
    }
  };

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
        showToast('Verification OTP resent successfully.', 'success');
        startCooldown();
      } else {
        setEmailOtpStatus({ type: 'error', message: 'Failed to resend OTP.' });
        showToast('Failed to resend OTP.', 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend email OTP.';
      setEmailOtpStatus({ type: 'error', message: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!formData.emailOtp.trim()) {
      setEmailOtpStatus({ type: 'error', message: 'Please enter the OTP from your email.' });
      return;
    }
    setVerifyingEmail(true);
    setEmailOtpStatus({ type: '', message: '' });
    setEmailVerified(false);
    localStorage.setItem('emailVerified', 'false');
    try {
      const res = await authService.verifyOTP(formData.email, formData.emailOtp.trim());
      if (res?.success) {
        setEmailVerified(true);
        localStorage.setItem('emailVerified', 'true');
        setEmailOtpStatus({ type: 'success', message: 'Email address verified successfully.' });
        showToast('Email verified!', 'success');
      } else {
        setEmailOtpStatus({ type: 'error', message: 'Invalid OTP. Please check and try again.' });
        showToast('Invalid OTP.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      const detail = msg.toLowerCase().includes('expired')
        ? 'OTP has expired. Click "Resend OTP" to get a new one.'
        : 'Invalid OTP. Please check and try again.';
      setEmailOtpStatus({ type: 'error', message: detail });
      showToast(detail, 'error');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleProceedToPasswords = () => {
    const emailOk  = localStorage.getItem('emailVerified') === 'true';
    const mobileOk = localStorage.getItem('mobileValidated') === 'true';
    setEmailVerified(emailOk);
    setPhoneVerified(mobileOk);
    if (emailOk && mobileOk) {
      setCurrentStep(3);
      setApiError('');
    } else {
      setApiError('Verification is incomplete. Please complete email and mobile validation.');
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = {};
    if (!formData.password)                              errs.password        = 'Password is required';
    else if (formData.password.length < 6)               errs.password        = 'Must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)  errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const emailOk  = localStorage.getItem('emailVerified') === 'true';
    const mobileOk = localStorage.getItem('mobileValidated') === 'true';

    const payload = {
      fullName: formData.fullName, email: formData.email,
      phone: formData.phoneNumber, phoneNumber: formData.phoneNumber,
      address: formData.address, panNumber: formData.panNumber,
      aadhaarNumber: formData.aadhaarNumber, password: formData.password,
      confirmPassword: formData.confirmPassword, emailOtp: formData.emailOtp,
      emailVerified: emailOk, mobileValidated: mobileOk,
    };

    setSubmitting(true);
    try {
      const res = await authService.signup(payload);
      if (res?.success) {
        localStorage.removeItem('emailVerified');
        localStorage.removeItem('mobileValidated');
        showToast('Account created! Welcome to GrowStar.', 'success');
        setCurrentStep(4);
        setTimeout(() => navigate('/login'), 3500);
      } else {
        const msg = res?.message || 'Registration failed. Please try again.';
        setApiError(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error during registration.';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { label: 'Details',      icon: 'bi-person' },
    { label: 'OTP Verify',   icon: 'bi-shield-check' },
    { label: 'Password',     icon: 'bi-lock' },
    { label: 'Done',         icon: 'bi-check-lg' },
  ];

  return (
    <div className="auth-layout">
      {/* Background glow orbs */}
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
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2">
            <BrandLogo width={40} height={40} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              GrowStar
            </span>
          </div>
        </div>

        {/* Main Centered Glassmorphic Wizard Card */}
        <div className="auth-card-dark signup-card">
          {/* Integrated Stepper */}
          {currentStep !== 4 && (
            <>
              <div className="signup-stepper mb-4">
                {STEPS.map((s, idx) => {
                  const n = idx + 1;
                  const done   = currentStep > n;
                  const active = currentStep === n;
                  return (
                    <div key={s.label} className={`step-item ${done ? 'completed' : active ? 'active' : ''}`}>
                      <div className="step-circle">
                        {done ? <i className="bi bi-check-lg"></i> : active ? <i className={`bi ${s.icon}`}></i> : n}
                      </div>
                      <span className="step-label">{s.label}</span>
                    </div>
                  );
                })}
              </div>
              <hr className="mt-0 mb-4" />
            </>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
              <span>{apiError}</span>
            </div>
          )}

          {/* ══ STEP 1: Client Details ══ */}
          {currentStep === 1 && (
            <div className="animate-fade">
              <h5 style={{ fontFamily: "'Outfit', sans-serif", color: '#ffffff', fontWeight: 700, marginBottom: '1.25rem' }}>
                <i className="bi bi-person-circle me-2" style={{ color: '#D4AF37' }}></i>
                Personal Information
              </h5>

              <div className="mb-3">
                <label className="form-label">Full Name <span style={{ color: '#f87171' }}>*</span></label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-person input-icon"></i>
                  <input
                    type="text"
                    name="fullName"
                    className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                    placeholder="As per official documents"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                {errors.fullName && (
                  <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                    {errors.fullName}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Email Address <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-envelope input-icon"></i>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="name@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.email}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mobile Number <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-phone input-icon"></i>
                    <input
                      type="text"
                      name="phoneNumber"
                      className={`form-control ${errors.phoneNumber ? 'is-invalid' : isPhoneValid ? 'is-valid' : ''}`}
                      placeholder="10-digit Indian number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {isPhoneValid && !errors.phoneNumber && (
                    <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 500, marginTop: '0.25rem' }}>
                      <i className="bi bi-check-circle-fill me-1"></i> Valid mobile number
                    </div>
                  )}
                  {errors.phoneNumber && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Residential Address <span style={{ color: '#f87171' }}>*</span></label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-geo-alt input-icon" style={{ top: '1.125rem', transform: 'none' }}></i>
                  <textarea
                    name="address"
                    rows="2"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    placeholder="Street address, City, State, PIN"
                    value={formData.address}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem', resize: 'none' }}
                  />
                </div>
                {errors.address && (
                  <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                    {errors.address}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">PAN Card Number <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-credit-card input-icon"></i>
                    <input
                      type="text"
                      name="panNumber"
                      className={`form-control ${errors.panNumber ? 'is-invalid' : ''}`}
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.panNumber && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.panNumber}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Aadhaar Number <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-fingerprint input-icon"></i>
                    <input
                      type="text"
                      name="aadhaarNumber"
                      className={`form-control ${errors.aadhaarNumber ? 'is-invalid' : ''}`}
                      placeholder="12-digit Aadhaar"
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.aadhaarNumber && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.aadhaarNumber}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleGenerateOTPs}
                disabled={generatingOtp}
              >
                {generatingOtp ? (
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
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-lock"></i>
                    Continue — Send OTP
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══ STEP 2: OTP Verification ══ */}
          {currentStep === 2 && (
            <div className="animate-fade">
              <h5 style={{ fontFamily: "'Outfit', sans-serif", color: '#ffffff', fontWeight: 700, marginBottom: '0.5rem' }}>
                <i className="bi bi-shield-check me-2" style={{ color: '#D4AF37' }}></i>
                Verify Your Identity
              </h5>
              <p style={{ color: 'rgba(148, 163, 184, 0.7)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
                Validate the OTP sent to your email to complete verification.
              </p>

              <div className="row g-3 mb-4">
                {/* Mobile validated */}
                <div className="col-md-6">
                  <div className="verify-panel success">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <i className="bi bi-phone-fill"></i> Mobile
                      </span>
                      <span className="status-badge approved" style={{ fontSize: '0.7rem' }}>Validated</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(148, 163, 184, 0.7)', margin: 0 }}>
                      +91 {formData.phoneNumber}
                    </p>
                    <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Number validated
                    </div>
                  </div>
                </div>

                {/* Email OTP */}
                <div className="col-md-6">
                  <div className={`verify-panel ${emailVerified ? 'success' : 'pending'}`}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: emailVerified ? '#34d399' : '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <i className="bi bi-envelope-at-fill"></i> Email OTP
                      </span>
                      <span className={`status-badge ${emailVerified ? 'approved' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                        {emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(148, 163, 184, 0.7)', margin: '0 0 0.625rem' }}>
                      Sent to {formData.email}
                    </p>
                    <input
                      type="text"
                      name="emailOtp"
                      className={`form-control form-control-sm text-center fw-bold ${emailOtpStatus.type === 'error' ? 'is-invalid' : emailVerified ? 'is-valid' : ''}`}
                      placeholder="• • • • • •"
                      maxLength="6"
                      disabled={emailVerified}
                      value={formData.emailOtp}
                      onChange={handleChange}
                      style={{ letterSpacing: '0.4em', fontSize: '1rem' }}
                    />
                    <OtpStatusMessage status={emailOtpStatus} />
                    <button
                      type="button"
                      className={`btn btn-sm w-100 mt-2 ${emailVerified ? 'btn-success' : 'btn-primary'}`}
                      onClick={handleVerifyEmailOtp}
                      disabled={emailVerified || verifyingEmail}
                      style={{
                        padding: '0.5rem 1rem !important',
                        fontSize: '0.8rem !important',
                        background: emailVerified ? '#059669 !important' : undefined,
                        color: emailVerified ? '#ffffff !important' : undefined
                      }}
                    >
                      {verifyingEmail ? (
                        <>
                          <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Verifying...
                        </>
                      ) : emailVerified ? (
                        <>
                          <i className="bi bi-check-lg me-1"></i>Verified
                        </>
                      ) : (
                        'Verify Email OTP'
                      )}
                    </button>
                    {!emailVerified && (
                      <button
                        type="button"
                        className="btn btn-sm w-100 mt-1"
                        onClick={handleResendEmailOtp}
                        disabled={emailCooldown > 0 || resendingEmail}
                        style={{ background: 'none', border: 'none', color: 'rgba(148, 163, 184, 0.7)', fontSize: '0.75rem', cursor: emailCooldown > 0 ? 'not-allowed' : 'pointer' }}
                      >
                        {resendingEmail ? 'Resending...'
                          : emailCooldown > 0 ? `Resend in ${emailCooldown}s`
                          : <><i className="bi bi-arrow-counterclockwise me-1"></i>Resend OTP</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div
                className="p-3 rounded-3 d-flex align-items-center gap-3 mb-4"
                style={{
                  background: emailVerified ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${emailVerified ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
                  fontSize: '0.8125rem'
                }}
              >
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <i className="bi bi-check-circle-fill"></i> Mobile
                </span>
                <span style={{ color: emailVerified ? '#34d399' : 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <i className={`bi ${emailVerified ? 'bi-check-circle-fill' : 'bi-circle'}`}></i> Email
                </span>
                <span style={{ marginLeft: 'auto', fontWeight: 600, color: emailVerified ? '#34d399' : 'rgba(148, 163, 184, 0.4)', fontSize: '0.75rem' }}>
                  {emailVerified ? <><i className="bi bi-shield-fill-check me-1"></i>Ready to proceed</> : 'Verify email to continue'}
                </span>
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary w-50" onClick={() => setCurrentStep(1)}>
                  <i className="bi bi-arrow-left me-1"></i>Back
                </button>
                <button type="button" className="btn btn-primary w-50" onClick={handleProceedToPasswords} disabled={!emailVerified}>
                  {emailVerified ? <><i className="bi bi-lock me-1"></i>Set Password</> : 'Verify Email First'}
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: Password Setup ══ */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmitRegistration} className="animate-fade">
              <h5 style={{ fontFamily: "'Outfit', sans-serif", color: '#ffffff', fontWeight: 700, marginBottom: '0.5rem' }}>
                <i className="bi bi-lock-fill me-2" style={{ color: '#D4AF37' }}></i>
                Secure Your Account
              </h5>

              {emailVerified && phoneVerified ? (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4 p-3 border-0">
                  <i className="bi bi-shield-fill-check flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
                  <span>Email and mobile verified. Create a secure password below.</span>
                </div>
              ) : (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-3 border-0">
                  <i className="bi bi-exclamation-triangle flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
                  <span>Verification incomplete. Please complete email and mobile validation.</span>
                </div>
              )}

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Set Password <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper has-right-icon">
                    <i className="bi bi-lock input-icon"></i>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)} aria-label="Toggle">
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.password}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Confirm Password <span style={{ color: '#f87171' }}>*</span></label>
                  <div className="input-icon-wrapper has-right-icon">
                    <i className="bi bi-lock-fill input-icon"></i>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowConfirmPass(!showConfirmPass)} aria-label="Toggle">
                      <i className={`bi ${showConfirmPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="invalid-feedback d-block mt-1" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <i className="bi bi-check-circle-fill"></i> Passwords match
                </div>
              )}

              <div className="d-flex gap-2 mt-2">
                <button type="button" className="btn btn-outline-primary w-50" onClick={() => setCurrentStep(2)}>
                  <i className="bi bi-arrow-left me-1"></i>Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-50"
                  disabled={submitting || !emailVerified || !phoneVerified || !formData.password || formData.password !== formData.confirmPassword}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check me-1"></i>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ══ STEP 4: Success ══ */}
          {currentStep === 4 && (
            <div className="text-center py-3 animate-fade">
              <div className="success-circle">
                <i className="bi bi-check-lg" style={{ fontSize: '2.25rem', color: '#34d399' }}></i>
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#34d399', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Account Created!
              </h3>
              <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
                Your GrowStar account has been successfully registered.
                <br />Redirecting to login dashboard...
              </p>
              <Link to="/login" className="btn btn-primary px-4">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Proceed to Login
              </Link>
            </div>
          )}

          {/* Footer Link */}
          {currentStep !== 4 && (
            <p className="text-center mt-4 mb-0" style={{ fontSize: '0.875rem', color: 'rgba(148,163,184,0.6)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#D4AF37', fontWeight: 600, textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
