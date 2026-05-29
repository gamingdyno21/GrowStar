const express = require('express');
const {
  createRecord,
  getMyRecords,
  updateRecord,
  deleteRecord,
} = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createRecord)
  .get(protect, getMyRecords);

router.route('/:id')
  .put(protect, updateRecord)
  .delete(protect, deleteRecord);

module.exports = router;
