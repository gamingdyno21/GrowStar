const express = require('express');
const {
  requestOTP,
  checkOTP,
  register,
  login,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

// Register and login paths
router.post('/register', register);
router.post('/login', login);

// OTP Verification paths
router.post('/generate-otp', requestOTP);
router.post('/forgot-password', requestOTP);
router.post('/verify-otp', checkOTP);

// Reset paths
router.post('/reset-password', resetPassword);

module.exports = router;
