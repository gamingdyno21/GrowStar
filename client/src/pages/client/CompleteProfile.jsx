import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import userService from '../../services/userService';
import BrandLogo from '../../components/common/BrandLogo';
import { formatPAN, formatPhone, getProfileCompletionProgress } from '../../utils/helpers';
import { REGEX_PATTERNS } from '../../utils/constants';

const CompleteProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    panNumber: '',
    dob: '',
    profilePic: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  
  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Populate data from logged in user
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phone || user.phoneNumber || '',
        address: user.address || '',
        panNumber: user.panNumber || '',
        dob: user.dob || '',
        profilePic: user.profilePic || ''
      });
      if (user.profilePic) {
        setCapturedImage(user.profilePic);
      }
    }
  }, [user]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [cameraStream]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'panNumber') v = formatPAN(value);
    if (name === 'phoneNumber') v = formatPhone(value);
    setFormData(prev => ({ ...prev, [name]: v }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const calculateProgress = () => {
    // We pass our current local formData state to get current progress instantly as user types
    const tempUserObj = {
      profilePic: formData.profilePic,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phoneNumber,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      dob: formData.dob
    };
    return getProfileCompletionProgress(tempUserObj);
  };

  const progress = calculateProgress();

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    setCameraLoading(true);
    setCapturedImage(null);

    // Stop existing camera stream if any
    if (cameraStream) {
      stopCamera();
    }

    const constraints = {
      video: {
        facingMode: 'user', // prioritized front camera on mobile
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Webcam/Camera is unavailable or access was denied. Please upload an image below instead.');
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video resolution
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw the current video frame on canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas frame to base64 jpeg
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Basic size validation (base64 length calculation fallback)
      const approxSize = (dataUrl.length * 3) / 4;
      if (approxSize > 2 * 1024 * 1024) {
        showToast('Captured photo exceeds the 2MB size limit.', 'error');
        return;
      }

      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const saveCapturedPhoto = () => {
    if (capturedImage) {
      setFormData(prev => ({ ...prev, profilePic: capturedImage }));
      showToast('Photo captured successfully!', 'success');
      setCapturedImage(null);
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Uploaded image is too large. Max limit is 2MB.', 'error');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        showToast('Invalid file format. Please upload a JPEG, PNG, JPG, or WEBP image.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePic: reader.result }));
        showToast('Profile photo uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (isSubmittingAll = false) => {
    const errs = {};
    if (isSubmittingAll) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      if (!formData.phoneNumber.trim()) errs.phoneNumber = 'Mobile number is required';
      else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) errs.phoneNumber = 'Must be a valid 10-digit Indian number';
      if (!formData.address.trim()) errs.address = 'Residential address is required';
      if (!formData.dob) errs.dob = 'Date of Birth is required';
      if (!formData.profilePic) errs.profilePic = 'Profile Photo is required';
      
      if (formData.panNumber.trim() && !REGEX_PATTERNS.PAN.test(formData.panNumber)) {
        errs.panNumber = 'Invalid PAN Number format (e.g. ABCDE1234F)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    try {
      const res = await userService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phoneNumber,
        address: formData.address,
        profilePic: formData.profilePic,
        dob: formData.dob,
        panNumber: formData.panNumber
      });

      if (res.success) {
        showToast('Progress saved successfully!', 'success');
        await refreshUser();
      } else {
        showToast(res.message || 'Failed to save progress.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving progress.', 'error');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(true)) {
      showToast('Please fill in all required fields and upload/capture your photo.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await userService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phoneNumber,
        address: formData.address,
        profilePic: formData.profilePic,
        dob: formData.dob,
        panNumber: formData.panNumber
      });

      if (res.success) {
        showToast('Profile completed successfully! Welcome to your dashboard.', 'success');
        await refreshUser();
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        showToast(res.message || 'Failed to complete profile.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting profile details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  // Sections Checklist computation
  const sections = [
    { name: 'Profile Photo', isComplete: !!formData.profilePic, req: true },
    { name: 'Full Name', isComplete: !!formData.fullName.trim(), req: true },
    { name: 'Email Address', isComplete: !!formData.email.trim(), req: true },
    { name: 'Mobile Number', isComplete: formData.phoneNumber.length === 10, req: true },
    { name: 'Residential Address', isComplete: !!formData.address.trim(), req: true },
    { name: 'Date of Birth', isComplete: !!formData.dob, req: true },
    { name: 'PAN Card Number', isComplete: !!formData.panNumber.trim() && REGEX_PATTERNS.PAN.test(formData.panNumber), req: false }
  ];

  return (
    <div className="auth-layout pb-5" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background glow orbs */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>
      <div className="auth-bg-grid"></div>

      {/* Minimal Header */}
      <header className="container py-3 d-flex align-items-center justify-content-between position-relative" style={{ zIndex: 10 }}>
        <div className="d-flex align-items-center gap-2">
          <BrandLogo width={36} height={36} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            GrowStar
          </span>
        </div>
        <button className="btn btn-sm btn-outline-danger px-3 py-1.5" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left me-1"></i> Logout
        </button>
      </header>

      {/* Main Body */}
      <main className="container flex-grow-1 d-flex align-items-center justify-content-center py-4 position-relative" style={{ zIndex: 5 }}>
        <div className="auth-card-dark signup-card w-100" style={{ maxWidth: '900px' }}>
          
          <div className="text-center mb-4">
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#ffffff', fontSize: '1.75rem' }}>
              Complete Your Profile
            </h2>
            <p className="text-muted small">
              Please provide the details below to unlock dashboard functionalities.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4 bg-dark-subtle p-3 rounded-3 border border-secondary border-opacity-10">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold text-white small">Overall Completion</span>
              <span className="badge bg-primary fs-7 px-2.5 py-1">{progress}% Completed</span>
            </div>
            <div className="progress" style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)' }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                role="progressbar" 
                style={{ width: `${progress}%` }} 
                aria-valuenow={progress} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
          </div>

          <div className="row g-4 text-start">
            
            {/* Checklist Column */}
            <div className="col-lg-4">
              <div className="bg-white bg-opacity-5 p-3 rounded-3 border border-white border-opacity-5 h-100">
                <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-card-checklist text-primary"></i> Checklist Sections
                </h6>
                <div className="d-flex flex-column gap-2.5">
                  {sections.map((sec, idx) => (
                    <div 
                      key={idx} 
                      className={`d-flex align-items-center justify-content-between p-2 rounded-2 ${sec.isComplete ? 'bg-success bg-opacity-10 text-success' : 'bg-light bg-opacity-5 text-secondary'}`}
                      style={{ fontSize: '0.82rem' }}
                    >
                      <span className="d-flex align-items-center gap-2">
                        {sec.isComplete ? (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className="bi bi-circle text-muted"></i>
                        )}
                        <span className={sec.isComplete ? 'text-white' : 'text-muted'}>{sec.name}</span>
                        {sec.req && <span className="text-danger small">*</span>}
                      </span>
                      <span className="small font-monospace fw-bold">
                        {sec.isComplete ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields & Photo Capture Column */}
            <div className="col-lg-8">
              <form onSubmit={handleSubmit}>
                
                {/* Profile Photo Section */}
                <div className="mb-4 p-3 bg-white bg-opacity-5 rounded-3 border border-white border-opacity-5 text-center">
                  <span className="d-block fw-semibold text-white mb-3 text-start small">
                    <i className="bi bi-camera me-1.5 text-primary"></i> Profile Photo <span className="text-danger">*</span>
                  </span>

                  <div className="d-flex flex-column align-items-center justify-content-center">
                    
                    {/* Live Camera Stream Container */}
                    {cameraActive && (
                      <div className="position-relative overflow-hidden border border-secondary rounded-3 bg-black mb-3 shadow" style={{ width: '100%', maxWidth: '320px', height: '240px' }}>
                        {cameraLoading && (
                          <div className="position-absolute top-50 start-50 translate-middle text-white text-center">
                            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
                            <div className="small">Starting camera...</div>
                          </div>
                        )}
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-100 h-100 object-fit-cover"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                    )}

                    {/* Image Preview Container (Captured or File Uploaded) */}
                    {!cameraActive && (
                      <div className="mb-3 position-relative">
                        {formData.profilePic ? (
                          <img 
                            src={formData.profilePic} 
                            alt="Preview" 
                            className="rounded-circle border border-2 border-primary object-fit-cover shadow"
                            style={{ width: '120px', height: '120px' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle bg-dark border border-secondary border-opacity-25 d-flex align-items-center justify-content-center shadow" 
                            style={{ width: '120px', height: '120px' }}
                          >
                            <i className="bi bi-person-bounding-box text-secondary fs-1"></i>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Camera Control Actions */}
                    <div className="d-flex flex-wrap gap-2.5 justify-content-center">
                      {!cameraActive && !capturedImage && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary px-3" 
                          onClick={startCamera}
                        >
                          <i className="bi bi-camera-fill me-1"></i> Take Photo
                        </button>
                      )}

                      {cameraActive && (
                        <>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-success px-3" 
                            onClick={capturePhoto}
                            disabled={cameraLoading}
                          >
                            <i className="bi bi-circle-fill me-1"></i> Capture Frame
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-secondary px-3" 
                            onClick={stopCamera}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {capturedImage && !cameraActive && (
                        <div className="text-center w-100">
                          <p className="small text-warning mb-2"><i className="bi bi-info-circle"></i> Verify photo preview below and save</p>
                          <div className="d-flex gap-2 justify-content-center">
                            <img 
                              src={capturedImage} 
                              alt="Captured Preview" 
                              className="border border-2 border-success rounded-3 mb-2" 
                              style={{ width: '160px', height: '120px', objectFit: 'cover' }}
                            />
                          </div>
                          <div className="d-flex gap-2 justify-content-center">
                            <button type="button" className="btn btn-sm btn-success px-3" onClick={saveCapturedPhoto}>
                              <i className="bi bi-check-lg"></i> Keep Photo
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger px-3" onClick={retakePhoto}>
                              <i className="bi bi-arrow-counterclockwise"></i> Retake
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera Error / Fallback Secure File Uploader */}
                    {(cameraError || !cameraActive) && !capturedImage && (
                      <div className="mt-3 w-100" style={{ maxWidth: '320px' }}>
                        {cameraError && (
                          <div className="alert alert-warning small p-2 mb-2 text-start" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i> {cameraError}
                          </div>
                        )}
                        <div className="position-relative">
                          <label className="btn btn-sm btn-outline-secondary w-100 py-2">
                            <i className="bi bi-upload me-1.5"></i> Secure Image Upload
                            <input 
                              type="file" 
                              accept="image/jpeg,image/png,image/jpg,image/webp" 
                              className="position-absolute opacity-0 start-0 top-0 w-100 h-100" 
                              style={{ cursor: 'pointer' }}
                              onChange={handleFileUpload}
                            />
                          </label>
                          <span className="d-block text-secondary small mt-1 text-center" style={{ fontSize: '0.7rem' }}>
                            Max size 2MB (JPEG, PNG, WEBP)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.profilePic && (
                    <div className="text-danger small mt-2" style={{ fontSize: '0.75rem' }}>
                      {errors.profilePic}
                    </div>
                  )}
                </div>

                {/* Form Inputs */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name <span className="text-danger">*</span></label>
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
                    {errors.fullName && <div className="invalid-feedback d-block mt-1 small" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{errors.fullName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-calendar input-icon"></i>
                      <input 
                        type="date" 
                        name="dob"
                        className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.dob && <div className="invalid-feedback d-block mt-1 small" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{errors.dob}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email Address <span className="text-muted">(Read Only)</span></label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-envelope input-icon"></i>
                      <input 
                        type="email" 
                        className="form-control bg-dark text-muted border-secondary border-opacity-25"
                        value={formData.email}
                        disabled 
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Mobile Number <span className="text-danger">*</span></label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-phone input-icon"></i>
                      <input 
                        type="text" 
                        name="phoneNumber"
                        className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                        placeholder="10-digit number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.phoneNumber && <div className="invalid-feedback d-block mt-1 small" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{errors.phoneNumber}</div>}
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Residential Address <span className="text-danger">*</span></label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-geo-alt input-icon" style={{ top: '1.125rem', transform: 'none' }}></i>
                      <textarea 
                        name="address"
                        rows="2"
                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                        placeholder="Complete residential address"
                        value={formData.address}
                        onChange={handleChange}
                        style={{ paddingLeft: '2.5rem', resize: 'none' }}
                      />
                    </div>
                    {errors.address && <div className="invalid-feedback d-block mt-1 small" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{errors.address}</div>}
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">PAN Number <span className="text-muted">(Optional)</span></label>
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
                    {errors.panNumber && <div className="invalid-feedback d-block mt-1 small" style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{errors.panNumber}</div>}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 mt-4 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary px-4 py-2"
                    disabled={savingProgress || submitting}
                    onClick={handleSaveProgress}
                  >
                    {savingProgress ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-1.5"></i> Save Progress
                      </>
                    )}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success px-5 py-2 fw-semibold"
                    disabled={submitting || savingProgress}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-1.5"></i> Complete Profile
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

          </div>

        </div>
      </main>

      <footer className="text-center py-3 position-relative" style={{ zIndex: 10 }}>
        <p className="text-secondary small mb-0">© {new Date().getFullYear()} GrowStar. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CompleteProfile;
