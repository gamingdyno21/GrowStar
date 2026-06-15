const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  generateOTP,
  verifyOTP,
  markIdentifierVerified,
  isIdentifierVerified,
  consumeVerification
} = require('../utils/otpService');
const { sendEmail } = require('../utils/emailService');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// @desc    Generate OTP for signup or password reset
// @route   POST /api/auth/generate-otp OR POST /api/auth/forgot-password
// @access  Public
const requestOTP = async (req, res) => {
  const { email, phoneNumber, phone } = req.body;
  const targetEmail = email ? email.toLowerCase().trim() : undefined;
  const targetPhone = phone || phoneNumber;

  if (!targetEmail && !targetPhone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    let message = 'OTP sent successfully';
    
    if (targetEmail) {
      const otp = generateOTP(targetEmail);
      try {
        await sendEmail({
          to: targetEmail,
          otp,
        });
        message = `OTP sent to email ${targetEmail}`;
      } catch (emailError) {
        console.error(`[OTP EMAIL ERROR] Failed to send OTP email to ${targetEmail}:`, emailError.message);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[OTP BYPASS LOG] Generated OTP for ${targetEmail} is: ${otp}`);
          message = `OTP generated (Dev Mode Fallback: ${otp})`;
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to dispatch verification email. Please verify configuration or retry.'
          });
        }
      }
    }

    // Phone validation is handled locally on the client. No backend OTP required.
    if (targetPhone && !targetEmail) {
      message = 'Mobile number validated locally. No OTP required.';
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP standalone
// @route   POST /api/auth/verify-otp
// @access  Public
const checkOTP = async (req, res) => {
  const { identifier, email, phoneNumber, phone, otp } = req.body;
  let targetIdentifier = identifier || email || phone || phoneNumber;

  if (!targetIdentifier || !otp) {
    return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
  }

  if (typeof targetIdentifier === 'string' && targetIdentifier.includes('@')) {
    targetIdentifier = targetIdentifier.toLowerCase().trim();
  }

  const isValid = verifyOTP(targetIdentifier, otp);
  if (isValid) {
    markIdentifierVerified(targetIdentifier);
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      otpSessionId: targetIdentifier
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
};

// @desc    Register a new client
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { phoneNumber } = req.body;
  console.log("Received phone:", phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({
      message: "Phone number is required"
    });
  }

  const {
    fullName,
    email,
    phone,
    address,
    panNumber,
    aadhaarNumber,
    password,
    confirmPassword,
    emailOtp,
    phoneOtp,
    phoneVerified,
    emailVerified,
    bankName,
    accountNumber,
    ifscCode,
  } = req.body;

  const targetPhone = phoneNumber || phone;

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    // Validate phone number format (10-digit Indian mobile number)
    const isPhoneValid = /^[6-9]\d{9}$/.test(targetPhone);
    if (!isPhoneValid) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit Indian mobile number is required.'
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Email OTP: verified via GrowStar backend OTP system (/verify-otp)
    const isEmailSessionVerified = isIdentifierVerified(normalizedEmail);

    if (!isEmailSessionVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email must be OTP-verified before completing registration.'
      });
    }

    // Consume email verification session
    consumeVerification(normalizedEmail);

    const emailExists = await User.findOne({ email: normalizedEmail, isDeleted: false });
    const phoneExists = await User.findOne({ phoneNumber: targetPhone, isDeleted: false });
    const panExists = await User.findOne({ panNumber, isDeleted: false });
    const aadhaarExists = await User.findOne({ aadhaarNumber, isDeleted: false });

    if (emailExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'User with this phone number already exists' });
    }
    if (panExists || aadhaarExists) {
      return res.status(400).json({ success: false, message: 'A user with this PAN or Aadhaar card already exists' });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      phoneNumber: phoneNumber,
      address,
      panNumber,
      aadhaarNumber,
      passwordHash: password, // Pre-save hook will hash it
      bankDetails: {
        bankName: bankName || "",
        accountNumber: accountNumber || "",
        ifscCode: ifscCode || ""
      },
      isVerified: true,
    });

    // Log Activity
    await ActivityLog.create({
      userId: user._id,
      userType: 'User',
      action: 'SIGNUP_SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Client registration completed',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        phoneNumber: user.phoneNumber,
        address: user.address,
        panNumber: user.panNumber,
        aadhaarNumber: user.aadhaarNumber,
        status: user.status,
        role: user.role,
        profilePic: user.profilePic || "",
        dob: user.dob || "",
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate client (login using email or phone)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: 'Credentials are required' });
  }

  let normalizedIdentifier = loginIdentifier;
  if (typeof loginIdentifier === 'string' && loginIdentifier.includes('@')) {
    normalizedIdentifier = loginIdentifier.toLowerCase().trim();
  }

  try {
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { phoneNumber: normalizedIdentifier }],
      isDeleted: false
    });

    if (user && (await user.matchPassword(password))) {
      await ActivityLog.create({
        userId: user._id,
        userType: 'User',
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneNumber,
          phoneNumber: user.phoneNumber,
          address: user.address,
          panNumber: user.panNumber,
          aadhaarNumber: user.aadhaarNumber,
          status: user.status,
          role: user.role,
          profilePic: user.profilePic || "",
          dob: user.dob || "",
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  try {
    const isOtpValid = verifyOTP(normalizedEmail, otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail, isDeleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = newPassword; // Pre-save hook will hash it
    await user.save();

    // Log Activity
    await ActivityLog.create({
      userId: user._id,
      userType: 'User',
      action: 'PASSWORD_RESET_SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestOTP,
  checkOTP,
  register,
  login,
  resetPassword,
};
