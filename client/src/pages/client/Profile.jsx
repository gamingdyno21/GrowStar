import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatPhone, getProfileCompletionProgress } from '../../utils/helpers';

const Profile = () => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    panNumber: '',
    aadhaarNumber: '',
    status: '',
    profilePic: '',
    dob: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Clean up camera on unmount/stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    setCameraLoading(true);
    setCapturedImage(null);

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: 'user', // prioritized front camera
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
      setCameraError('Camera access is required to capture your profile photo. Please enable camera permissions or use a device with a camera.');
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

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const approxSize = (dataUrl.length * 3) / 4;
      if (approxSize > 2 * 1024 * 1024) {
        showToast('Captured photo exceeds the 2MB size limit.', 'error');
        return;
      }

      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const keepCapturedPhoto = () => {
    if (capturedImage) {
      setProfile(prev => ({
        ...prev,
        profilePic: capturedImage
      }));
      setCapturedImage(null);
      setCameraActive(false);
      showToast('Profile photo set successfully from camera preview!', 'success');
    }
  };

  const calculateProgress = () => {
    const tempUserObj = {
      profilePic: profile.profilePic,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phoneNumber,
      phoneNumber: profile.phoneNumber,
      address: profile.address,
      dob: profile.dob
    };
    const progress = getProfileCompletionProgress(tempUserObj);
    
    const missing = [];
    if (!profile.profilePic) missing.push('Profile Photo');
    if (!profile.fullName) missing.push('Full Name');
    if (!profile.email) missing.push('Email');
    if (!profile.phoneNumber) missing.push('Mobile Number');
    if (!profile.address) missing.push('Residential Address');
    if (!profile.dob) missing.push('Date of Birth');
    
    return { progress, missing };
  };

  const { progress: completionProgress, missing: missingFields } = calculateProgress();

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const pRes = await userService.getProfile();

      if (pRes.success && pRes.data) {
        const u = pRes.data;
        setProfile({
          ...u,
          phoneNumber: u.phone || u.phoneNumber || '',
          profilePic: u.profilePic || '',
          dob: u.dob || '',
          bankName: u.bankDetails?.bankName || '',
          accountNumber: u.bankDetails?.accountNumber || '',
          ifscCode: u.bankDetails?.ifscCode || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      showToast('Failed to load profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'phoneNumber') formatted = formatPhone(value);
    setProfile({ ...profile, [name]: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!profile.fullName.trim()) {
      setErrorMsg('Full name cannot be blank');
      return;
    }
    if (profile.phoneNumber.length < 10) {
      setErrorMsg('Phone number must be at least 10 digits');
      return;
    }
    if (!profile.address.trim()) {
      setErrorMsg('Address is required');
      return;
    }

    setUpdating(true);
    try {
      const res = await userService.updateProfile({
        fullName: profile.fullName,
        phone: profile.phoneNumber,
        address: profile.address,
        profilePic: profile.profilePic,
        dob: profile.dob,
        bankDetails: {
          bankName: profile.bankName,
          accountNumber: profile.accountNumber,
          ifscCode: profile.ifscCode
        }
      });

      if (res.success) {
        setErrorMsg('');
        setSuccessMsg('Profile updated successfully!');
        showToast('Profile updated successfully!', 'success');
        refreshUser();
      } else {
        const failMsg = res.message || 'Profile update failed.';
        setErrorMsg(failMsg);
        showToast(failMsg, 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error saving profile.';
      setErrorMsg(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        <PageHeader title="Profile & Settlement Settings" subtitle="Adjust bank credentials, personal details and view KYC status" />

        {/* Profile Completion Progress Bar */}
        {!loading && (
          <div className="card p-3 mb-4 border-light shadow-sm bg-white rounded-3 text-start">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.05em' }}>Profile Completion Status</span>
              <span className={`badge fs-7 bg-${completionProgress === 100 ? 'success' : 'primary'}`}>{completionProgress}% Complete</span>
            </div>
            <div className="progress mb-2" style={{ height: '8px', background: 'rgba(0, 0, 0, 0.05)' }}>
              <div 
                className={`progress-bar progress-bar-striped progress-bar-animated bg-${completionProgress === 100 ? 'success' : 'warning'}`} 
                role="progressbar" 
                style={{ width: `${completionProgress}%` }}
                aria-valuenow={completionProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            {completionProgress < 100 ? (
              <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-info-circle-fill text-warning me-1"></i>
                Please fill in your Profile Photo and Date of Birth to complete your profile (Currently missing: {missingFields.join(', ')}).
              </span>
            ) : (
              <span className="text-success small fw-semibold" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-check-circle-fill me-1"></i>
                Your profile is fully complete! All platform features are unlocked.
              </span>
            )}
          </div>
        )}

        {loading ? (
          <Loader />
        ) : (
          <div className="row justify-content-center animate-fade">
            {/* Account Status and Details */}
            <div className="col-md-10 col-lg-8">
              <Card title="Personal & Settlement Details">
                {successMsg && <div className="alert alert-success small py-2">{successMsg}</div>}
                {errorMsg && <div className="alert alert-danger small py-2">{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="text-start">
                  
                  {/* Unified Photo Upload & Camera Capture Section */}
                  <div className="mb-4 p-3 bg-light rounded-3 border">
                    <span className="d-block fw-semibold text-dark small mb-3">Profile Photo</span>
                    
                    <div className="d-flex flex-wrap align-items-center gap-4">
                      
                      {/* Photo preview or video element */}
                      <div className="position-relative">
                        {cameraActive ? (
                          <div className="position-relative overflow-hidden border rounded-3 bg-black shadow-sm" style={{ width: '160px', height: '120px' }}>
                            {cameraLoading && (
                              <div className="position-absolute top-50 start-50 translate-middle text-white text-center" style={{ fontSize: '0.75rem' }}>
                                <div className="spinner-border spinner-border-sm text-primary mb-1"></div>
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
                        ) : capturedImage ? (
                          <img
                            src={capturedImage}
                            alt="Captured preview"
                            className="rounded-3 border object-fit-cover shadow-sm"
                            style={{ width: '160px', height: '120px' }}
                          />
                        ) : profile.profilePic ? (
                          <img
                            src={profile.profilePic}
                            alt="Profile Pic"
                            className="rounded-circle border object-fit-cover shadow-sm"
                            style={{ width: '80px', height: '80px' }}
                          />
                        ) : (
                          <div className="rounded-circle bg-primary-subtle text-primary border d-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-person fs-2" />
                          </div>
                        )}
                      </div>

                      {/* Photo capture and upload actions */}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        
                        {/* Interactive state buttons */}
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
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
                                <i className="bi bi-circle-fill me-1"></i> Capture
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

                          {capturedImage && (
                            <>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-success px-3" 
                                onClick={keepCapturedPhoto}
                              >
                                <i className="bi bi-check-lg"></i> Keep Photo
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-danger px-3" 
                                onClick={() => { setCapturedImage(null); startCamera(); }}
                              >
                                <i className="bi bi-arrow-counterclockwise"></i> Retake
                              </button>
                            </>
                          )}
                        </div>

                        {/* Camera Error Message Display */}
                        {cameraError && !cameraActive && !capturedImage && (
                          <div className="alert alert-danger small p-2" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-exclamation-triangle-fill me-1.5"></i> {cameraError}
                          </div>
                        )}

                      </div>

                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={profile.fullName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-control"
                        value={profile.dob}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Registered Email</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={profile.email}
                        disabled
                        readOnly
                      />
                      <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                        Email cannot be modified directly.
                      </span>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Phone Number</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        className="form-control"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold text-secondary small">Residential Address</label>
                      <textarea
                        name="address"
                        className="form-control"
                        rows="3"
                        value={profile.address}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4 text-secondary" />
                  <h6 className="fw-bold text-primary mb-3 text-uppercase">Settlement Bank Details</h6>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        className="form-control"
                        placeholder="e.g. State Bank of India"
                        value={profile.bankName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        className="form-control"
                        placeholder="e.g. 100234902344"
                        value={profile.accountNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary small">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        className="form-control"
                        placeholder="e.g. SBIN0001234"
                        value={profile.ifscCode}
                        onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  {/* Document Display Section */}
                  <div className="card p-3 border-light bg-light-subtle rounded-3 mb-4 mt-2">
                    <span className="fw-semibold text-primary mb-3 d-block">KYC Information (Read Only)</span>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <label className="text-secondary small fw-medium">PAN Number</label>
                        <div className="p-2 border rounded bg-white font-monospace">{profile.panNumber || 'N/A'}</div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <label className="text-secondary small fw-medium">Aadhaar Number</label>
                        <div className="p-2 border rounded bg-white font-monospace">XXXX-XXXX-{profile.aadhaarNumber?.slice(-4) || 'XXXX'}</div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary px-4" disabled={updating}>
                    {updating ? 'Saving Profile...' : 'Save Settings & Bank Details'}
                  </button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
