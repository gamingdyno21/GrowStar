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

  // KYC-Grade states
  const [detector, setDetector] = useState(null);
  const [loadingEngine, setLoadingEngine] = useState(false);
  const [kycStatus, setKycStatus] = useState({
    faceDetected: false,
    faceCentered: false,
    goodLighting: false,
    isStable: false,
    ready: false
  });
  const [kycInstruction, setKycInstruction] = useState('Initializing verification...');
  const [qualityScore, setQualityScore] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const activeLoopRef = useRef(false);
  const detectionLoopIdRef = useRef(null);
  const prevFrameRef = useRef(null);
  const lastStableTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Clean up camera on unmount/stream change
  useEffect(() => {
    return () => {
      activeLoopRef.current = false;
      if (detectionLoopIdRef.current) {
        cancelAnimationFrame(detectionLoopIdRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Load the MediaPipe FaceDetector engine dynamically
  const loadVerificationEngine = async () => {
    if (detectorRef.current) return detectorRef.current;
    setLoadingEngine(true);
    setCameraError('');
    try {
      // Dynamic load vision bundle via jsdelivr CDN
      const { FaceDetector, FilesetResolver } = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js"
      );

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const instance = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.task",
          delegate: "GPU"
        },
        runningMode: "IMAGE"
      });

      detectorRef.current = instance;
      setDetector(instance);
      return instance;
    } catch (err) {
      console.error("KYC Engine load failed:", err);
      setCameraError("Failed to load face verification module. Please verify your internet connection.");
      throw err;
    } finally {
      setLoadingEngine(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    setCameraLoading(true);
    setCapturedImage(null);

    setKycStatus({
      faceDetected: false,
      faceCentered: false,
      goodLighting: false,
      isStable: false,
      ready: false
    });
    setKycInstruction('Loading identity verification engine...');
    setQualityScore(0);

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      await loadVerificationEngine();

      const constraints = {
        video: {
          facingMode: 'user', // prioritized front camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            startDetectionLoop();
          }).catch(err => {
            console.error("Video play error:", err);
          });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access and KYC initialization is required to capture your profile photo. Please enable camera permissions and check your internet connection.');
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    activeLoopRef.current = false;
    if (detectionLoopIdRef.current) {
      cancelAnimationFrame(detectionLoopIdRef.current);
      detectionLoopIdRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const startDetectionLoop = () => {
    if (!videoRef.current || !detectorRef.current) return;
    activeLoopRef.current = true;
    prevFrameRef.current = null;
    lastStableTimeRef.current = Date.now();

    const run = () => {
      if (!activeLoopRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          processFrame(video);
        } catch (e) {
          console.error("Error in frame processing:", e);
        }
      }
      detectionLoopIdRef.current = requestAnimationFrame(run);
    };

    detectionLoopIdRef.current = requestAnimationFrame(run);
  };

  // Black frame/Blank frame helper function
  const isBlackOrBlankImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    
    let sum = 0;
    let sumSq = 0;
    const step = 8;
    let count = 0;
    
    for (let i = 0; i < pixels.length; i += step * 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const val = (r + g + b) / 3;
      sum += val;
      sumSq += val * val;
      count++;
    }
    
    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    const stdDev = Math.sqrt(variance);
    return mean < 15 || stdDev < 4;
  };

  const processFrame = (video) => {
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    // 1. Black/Blank Image Check
    const isBlank = isBlackOrBlankImage(canvas);

    // 2. Brightness Check & Grayscale Analysis
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;
    tempCanvas.height = 150;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, 200, 150);
    const tempImgData = tempCtx.getImageData(0, 0, 200, 150);
    const data = tempImgData.data;

    let sumLuminance = 0;
    let sumSqLuminance = 0;
    const totalPixels = 200 * 150;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLuminance += luminance;
      sumSqLuminance += luminance * luminance;
    }

    const avgBrightness = sumLuminance / totalPixels;
    const isGoodLighting = !isBlank && avgBrightness >= 50 && avgBrightness <= 220;

    // 3. Motion & Stability Check
    const motionCanvas = document.createElement('canvas');
    motionCanvas.width = 32;
    motionCanvas.height = 24;
    const motionCtx = motionCanvas.getContext('2d');
    motionCtx.drawImage(canvas, 0, 0, 32, 24);
    const motionData = motionCtx.getImageData(0, 0, 32, 24).data;

    const currentGrayscale = new Uint8Array(32 * 24);
    for (let i = 0; i < motionData.length; i += 4) {
      currentGrayscale[i / 4] = Math.round(0.299 * motionData[i] + 0.587 * motionData[i + 1] + 0.114 * motionData[i + 2]);
    }

    let motionDiff = 0;
    if (prevFrameRef.current) {
      let diffSum = 0;
      const prev = prevFrameRef.current;
      for (let i = 0; i < 32 * 24; i++) {
        diffSum += Math.abs(currentGrayscale[i] - prev[i]);
      }
      motionDiff = diffSum / (32 * 24);
    }
    prevFrameRef.current = currentGrayscale;

    const isMovingExcessively = motionDiff > 2.2;
    if (isMovingExcessively) {
      lastStableTimeRef.current = Date.now();
    }
    const isStable = (Date.now() - lastStableTimeRef.current) >= 1200;

    // 4. Sharpness Check (Laplacian Variance)
    const gray = new Float32Array(totalPixels);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    let laplacianSum = 0;
    let laplacianSquareSum = 0;
    const cols = 200;
    const rows = 150;
    const countLaplacian = (cols - 2) * (rows - 2);

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const idx = y * cols + x;
        const val = -4 * gray[idx] +
                    gray[idx - 1] +
                    gray[idx + 1] +
                    gray[idx - cols] +
                    gray[idx + cols];
        laplacianSum += val;
        laplacianSquareSum += val * val;
      }
    }

    const meanLaplacian = laplacianSum / countLaplacian;
    const varianceLaplacian = (laplacianSquareSum / countLaplacian) - (meanLaplacian * meanLaplacian);
    const isSharp = varianceLaplacian >= 18.0;

    // 5. Face Detection
    const detectionsResult = detectorRef.current.detect(canvas);
    const detections = detectionsResult.detections || [];

    if (detections.length === 0) {
      setKycStatus({
        faceDetected: false,
        faceCentered: false,
        goodLighting: isGoodLighting,
        isStable: isStable,
        ready: false
      });
      setKycInstruction("Position your face inside the frame.");
      setQualityScore(0);
      return;
    }

    if (detections.length > 1) {
      setKycStatus({
        faceDetected: false,
        faceCentered: false,
        goodLighting: isGoodLighting,
        isStable: isStable,
        ready: false
      });
      setKycInstruction("Only one person should be visible.");
      setQualityScore(0);
      return;
    }

    // Single face detected
    const detection = detections[0];
    const bbox = detection.boundingBox;

    const faceLeft = bbox.originX;
    const faceTop = bbox.originY;
    const faceWidth = bbox.width;
    const faceHeight = bbox.height;
    
    const faceCx = faceLeft + faceWidth / 2;
    const faceCy = faceTop + faceHeight / 2;
    
    const frameCx = width / 2;
    const frameCy = height / 2;
    
    // Centering: center of face within 12% of frame center
    const offsetX = Math.abs(faceCx - frameCx) / width;
    const offsetY = Math.abs(faceCy - frameCy) / height;
    const faceCentered = offsetX < 0.12 && offsetY < 0.12;
    
    // Closeness
    const faceSizeRatio = faceWidth / width;
    const isTooFar = faceSizeRatio < 0.28;
    const isTooClose = faceSizeRatio > 0.65;
    
    // Check if cropped
    const isCropped = faceLeft < 15 || faceTop < 15 || 
                      (faceLeft + faceWidth) > (width - 15) || 
                      (faceTop + faceHeight) > (height - 15);

    // Keypoints analysis
    const keypoints = detection.keypoints || [];
    let eyesVisible = false;
    let lookingStraight = false;
    
    if (keypoints.length >= 3) {
      const re = keypoints[0];
      const le = keypoints[1];
      const nose = keypoints[2];
      
      const reX = re.x * width;
      const reY = re.y * height;
      const leX = le.x * width;
      const leY = le.y * height;
      const noseX = nose.x * width;
      
      const reInBox = reX >= faceLeft && reX <= (faceLeft + faceWidth) && reY >= faceTop && reY <= (faceTop + faceHeight);
      const leInBox = leX >= faceLeft && leX <= (faceLeft + faceWidth) && leY >= faceTop && leY <= (faceTop + faceHeight);
      
      eyesVisible = reInBox && leInBox;
      
      if (eyesVisible) {
        const noseToLeftEye = Math.abs(noseX - leX);
        const noseToRightEye = Math.abs(noseX - reX);
        const symmetryRatio = Math.min(noseToLeftEye, noseToRightEye) / Math.max(noseToLeftEye, noseToRightEye);
        lookingStraight = symmetryRatio > 0.4; // nose is centered between eyes
      }
    }

    // Determine instructional guidelines
    let instruction = "Ready to capture!";
    if (isTooFar) {
      instruction = "Move closer to the camera.";
    } else if (isTooClose) {
      instruction = "Move back from the camera.";
    } else if (!faceCentered) {
      instruction = "Center your face.";
    } else if (isCropped) {
      instruction = "Ensure your face is not cropped.";
    } else if (!eyesVisible) {
      instruction = "Ensure both eyes are visible.";
    } else if (!lookingStraight) {
      instruction = "Look straight at the camera.";
    } else if (!isGoodLighting) {
      instruction = "Improve lighting and try again.";
    } else if (isMovingExcessively || !isStable) {
      instruction = "Please stay still while capturing your photo.";
    } else if (!isSharp) {
      instruction = "Image is blurry. Please hold still and retake.";
    }

    // Calculate quality score
    const cScore = Math.max(0, 25 * (1 - (offsetX + offsetY) / 0.24));
    const sScore = Math.min(25, (varianceLaplacian / 30.0) * 25);
    const bDev = Math.abs(avgBrightness - 128) / 128;
    const bScore = Math.max(0, 25 * (1 - bDev));
    const dConf = detection.categories?.[0]?.score || 1.0;
    const vScore = dConf * 25;
    const totalScore = Math.round(cScore + sScore + bScore + vScore);

    setQualityScore(totalScore);

    // Update KYC Checklist
    const allChecksPass = faceCentered &&
                          !isTooFar &&
                          !isTooClose &&
                          !isCropped &&
                          eyesVisible &&
                          lookingStraight &&
                          isGoodLighting &&
                          isStable &&
                          isSharp &&
                          totalScore >= 70;

    setKycStatus({
      faceDetected: true,
      faceCentered: faceCentered && !isTooFar && !isTooClose && !isCropped && lookingStraight,
      goodLighting: isGoodLighting,
      isStable: isStable && isSharp,
      ready: allChecksPass
    });

    setKycInstruction(instruction);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Security check: resolution
      if (width < 400 || height < 400) {
        showToast(`Camera resolution is too low (${width}x${height}). Minimum required is 400x400.`, 'error');
        return;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      // Security check: blank/black image
      if (isBlackOrBlankImage(canvas)) {
        showToast('Cannot save a blank/empty image.', 'error');
        return;
      }

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
                  <div className="mb-4 p-4 bg-white rounded-3 border shadow-sm">
                    <span className="d-block fw-bold text-dark mb-3">KYC Profile Photo Verification</span>
                    
                    <div className="d-flex flex-column align-items-center justify-content-center text-center">
                      
                      {/* Photo preview or video element */}
                      {cameraActive ? (
                        <div className="w-100 d-flex flex-column align-items-center gap-3">
                          {/* Live Video Window */}
                          <div 
                            className="position-relative border border-2 border-dark rounded-3 bg-black shadow overflow-hidden" 
                            style={{ width: '100%', maxWidth: '360px', aspectRatio: '4/3' }}
                          >
                            {cameraLoading && (
                              <div className="position-absolute top-50 start-50 translate-middle text-white text-center" style={{ zIndex: 10 }}>
                                <div className="spinner-border text-primary mb-2"></div>
                                <div className="small fw-semibold">Loading camera...</div>
                              </div>
                            )}
                            
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className="w-100 h-100 object-fit-cover"
                            />
                            
                            {/* Hidden processing canvas */}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {/* Circular Face Guide Overlay */}
                            {!cameraLoading && (
                              <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none', zIndex: 2 }}>
                                <defs>
                                  <mask id="face-mask">
                                    <rect width="100%" height="100%" fill="white" />
                                    {/* 110px radius cutout at the center */}
                                    <circle cx="50%" cy="50%" r="110" fill="black" />
                                  </mask>
                                </defs>
                                {/* Semi-transparent dark mask overlay */}
                                <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#face-mask)" />
                                {/* Glow circle border */}
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r="110"
                                  fill="none"
                                  stroke={kycStatus.ready ? '#198754' : '#ffc107'}
                                  strokeWidth="3"
                                  strokeDasharray={kycStatus.ready ? 'none' : '6, 6'}
                                  style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                                />
                              </svg>
                            )}

                            {/* Instruction banner overlay */}
                            {!cameraLoading && (
                              <div 
                                className="position-absolute bottom-0 start-0 w-100 text-center p-2 text-white fw-bold small" 
                                style={{ 
                                  zIndex: 3, 
                                  backgroundColor: kycStatus.ready ? 'rgba(25, 135, 84, 0.88)' : 'rgba(33, 37, 41, 0.85)',
                                  transition: 'background-color 0.3s ease'
                                }}
                              >
                                {kycStatus.ready ? (
                                  <span className="d-flex align-items-center justify-content-center gap-1 animate-pulse">
                                    <i className="bi bi-camera-fill"></i> READY: HOLD STILL & CAPTURE
                                  </span>
                                ) : (
                                  <span>{kycInstruction}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Real-time Checklist & Badges */}
                          <div className="card p-3 bg-light border-0 w-100 mt-2" style={{ maxWidth: '360px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                              <h6 className="fw-bold text-dark mb-0 small text-uppercase" style={{ letterSpacing: '0.05em' }}>Verification Checklist</h6>
                              <span className="badge bg-secondary-subtle text-dark-emphasis small">Real-time</span>
                            </div>
                            
                            <div className="d-flex flex-column gap-2 text-start">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small text-secondary">Face Detected</span>
                                {kycStatus.faceDetected ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-check-circle-fill"></i> Detected
                                  </span>
                                ) : (
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-x-circle-fill"></i> Missing
                                  </span>
                                )}
                              </div>

                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small text-secondary">Face Centered & Aligned</span>
                                {kycStatus.faceCentered ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-check-circle-fill"></i> Centered
                                  </span>
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-exclamation-circle-fill"></i> Unaligned
                                  </span>
                                )}
                              </div>

                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small text-secondary">Good Lighting</span>
                                {kycStatus.goodLighting ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-check-circle-fill"></i> Good
                                  </span>
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-exclamation-circle-fill"></i> Poor Lighting
                                  </span>
                                )}
                              </div>

                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small text-secondary">Stable Position</span>
                                {kycStatus.isStable ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-check-circle-fill"></i> Stable
                                  </span>
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-flex align-items-center gap-1 small">
                                    <i className="bi bi-exclamation-circle-fill"></i> Moving...
                                  </span>
                                )}
                              </div>

                              <hr className="my-2" />

                              <div className="d-flex align-items-center justify-content-between">
                                <span className="small fw-bold text-dark">Ready to Capture</span>
                                {kycStatus.ready ? (
                                  <span className="badge bg-success d-flex align-items-center gap-1 small">
                                    <i className="bi bi-shield-check"></i> Ready
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary d-flex align-items-center gap-1 small">
                                    <i className="bi bi-shield-slash"></i> Checking
                                  </span>
                                )}
                              </div>

                              {/* Quality match score */}
                              <div className="mt-2 pt-2 border-top">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small text-secondary fw-semibold">Quality Match Score:</span>
                                  <span className={`small fw-bold text-${qualityScore >= 70 ? 'success' : 'warning'}`}>{qualityScore}%</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div 
                                    className={`progress-bar bg-${qualityScore >= 70 ? 'success' : 'warning'}`} 
                                    role="progressbar" 
                                    style={{ width: `${qualityScore}%`, transition: 'width 0.3s ease' }}
                                    aria-valuenow={qualityScore}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Control Buttons */}
                          <div className="d-flex gap-2 justify-content-center mt-2">
                            <button 
                              type="button" 
                              className={`btn btn-lg px-4 ${kycStatus.ready ? 'btn-success shadow-lg' : 'btn-secondary'}`} 
                              onClick={capturePhoto}
                              disabled={!kycStatus.ready || cameraLoading}
                            >
                              <i className="bi bi-camera-fill me-1"></i> Capture Photo
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-3" 
                              onClick={stopCamera}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : capturedImage ? (
                        <div className="text-center w-100" style={{ maxWidth: '360px' }}>
                          <img
                            src={capturedImage}
                            alt="Captured preview"
                            className="rounded-3 border object-fit-cover shadow-sm mb-3 w-100"
                            style={{ aspectRatio: '4/3' }}
                          />
                          <div className="alert alert-success py-2 small mb-3">
                            <i className="bi bi-shield-check-fill me-1"></i> Image passed all KYC validation checks!
                          </div>
                          <div className="d-flex gap-2 justify-content-center">
                            <button 
                              type="button" 
                              className="btn btn-success px-4" 
                              onClick={keepCapturedPhoto}
                            >
                              <i className="bi bi-check-lg me-1"></i> Keep Photo
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-danger px-3" 
                              onClick={() => { setCapturedImage(null); startCamera(); }}
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i> Retake
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mb-3 position-relative d-inline-block">
                            {profile.profilePic ? (
                              <img
                                src={profile.profilePic}
                                alt="Profile Pic"
                                className="rounded-circle border object-fit-cover shadow-sm"
                                style={{ width: '120px', height: '120px' }}
                              />
                            ) : (
                              <div className="rounded-circle bg-primary-subtle text-primary border d-flex align-items-center justify-content-center shadow-sm" style={{ width: '120px', height: '120px' }}>
                                <i className="bi bi-person fs-1" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <button 
                              type="button" 
                              className="btn btn-primary px-4" 
                              onClick={startCamera}
                            >
                              <i className="bi bi-camera-fill me-1"></i> Verify & Take Photo
                            </button>
                            <span className="d-block text-secondary small mt-2">
                              A camera is required to capture and verify your identity photo.
                            </span>
                          </div>
                        </div>
                      )}
                      
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
