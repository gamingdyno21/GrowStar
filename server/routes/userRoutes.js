const express = require('express');
const { getUserProfile, updateUserProfile, getUserActivity } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/activity', protect, getUserActivity);

module.exports = router;
