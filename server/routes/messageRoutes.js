const express = require('express');
const {
  sendMessage,
  getClientMessages,
  getAdminMessages,
  replyMessage,
  resolveMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, sendMessage)
  .get(protect, getClientMessages);

router.get('/admin', protect, adminOnly, getAdminMessages);
router.put('/admin/:id/reply', protect, adminOnly, replyMessage);
router.put('/admin/:id/resolve', protect, adminOnly, resolveMessage);

module.exports = router;
