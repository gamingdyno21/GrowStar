const FinancialRecord = require('../models/FinancialRecord');

// @desc    Get current user's financial records (read-only for clients)
// @route   GET /api/finance
// @access  Private
const getMyRecords = async (req, res) => {
  try {
    const records = await FinancialRecord.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyRecords,
};
