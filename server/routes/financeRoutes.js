const express = require('express');
const {
  getMyRecords,
} = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Clients may only read their records — mutations are admin-only via /api/admin/users/:id/transactions
router.get('/', protect, getMyRecords);

module.exports = router;
