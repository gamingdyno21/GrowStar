const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.phoneNumber = req.body.phoneNumber || req.body.phone || user.phoneNumber;
      user.address = req.body.address || user.address;
      
      if (req.body.password) {
        user.passwordHash = req.body.password; // Map password changes to passwordHash schema
      }

      if (req.body.profilePic !== undefined) {
        user.profilePic = req.body.profilePic;
      }

      if (req.body.dob !== undefined) {
        user.dob = req.body.dob;
      }

      if (req.body.bankDetails) {
        user.bankDetails = {
          bankName: req.body.bankDetails.bankName !== undefined ? req.body.bankDetails.bankName : user.bankDetails.bankName,
          accountNumber: req.body.bankDetails.accountNumber !== undefined ? req.body.bankDetails.accountNumber : user.bankDetails.accountNumber,
          ifscCode: req.body.bankDetails.ifscCode !== undefined ? req.body.bankDetails.ifscCode : user.bankDetails.ifscCode
        };
      } else {
        user.bankDetails = {
          bankName: req.body.bankName !== undefined ? req.body.bankName : user.bankDetails.bankName,
          accountNumber: req.body.accountNumber !== undefined ? req.body.accountNumber : user.bankDetails.accountNumber,
          ifscCode: req.body.ifscCode !== undefined ? req.body.ifscCode : user.bankDetails.ifscCode
        };
      }

      const updatedUser = await user.save();

      // Log Activity
      await ActivityLog.create({
        userId: user._id,
        userType: 'User',
        action: 'PROFILE_UPDATE_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phoneNumber,
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address,
          status: updatedUser.status,
          role: updatedUser.role,
          profilePic: updatedUser.profilePic,
          dob: updatedUser.dob,
          bankDetails: updatedUser.bankDetails,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user activity logs
// @route   GET /api/user/activity
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserActivity,
};
