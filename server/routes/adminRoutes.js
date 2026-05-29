const express = require('express');
const {
  adminLogin,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAdminStats,
  updateUserPortfolio,
  addActiveInvestment,
  updateActiveInvestment,
  deleteActiveInvestment,
  addDailyProfit,
  deleteDailyProfit,
  addUserTransaction,
  updateUserTransaction,
  deleteUserTransaction,
  deleteUser,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/users', protect, adminOnly, getAllUsers);
router.route('/users/:id')
  .get(protect, adminOnly, getUserDetails)
  .delete(protect, adminOnly, deleteUser);
router.put('/users/:id/status', protect, adminOnly, updateUserStatus);
router.get('/stats', protect, adminOnly, getAdminStats);

// Portfolio Stats Endpoints
router.put('/users/:id/portfolio', protect, adminOnly, updateUserPortfolio);

// Active Investments Endpoints
router.post('/users/:id/investments', protect, adminOnly, addActiveInvestment);
router.put('/users/:id/investments/:invId', protect, adminOnly, updateActiveInvestment);
router.delete('/users/:id/investments/:invId', protect, adminOnly, deleteActiveInvestment);

// Daily Profit Timeline Endpoints
router.post('/users/:id/daily-profit', protect, adminOnly, addDailyProfit);
router.delete('/users/:id/daily-profit/:profitId', protect, adminOnly, deleteDailyProfit);

// Transactions Ledger Endpoints
router.post('/users/:id/transactions', protect, adminOnly, addUserTransaction);
router.put('/users/:id/transactions/:transId', protect, adminOnly, updateUserTransaction);
router.delete('/users/:id/transactions/:transId', protect, adminOnly, deleteUserTransaction);

module.exports = router;
