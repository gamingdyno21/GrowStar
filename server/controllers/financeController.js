const FinancialRecord = require('../models/FinancialRecord');

// @desc    Create a new financial record
// @route   POST /api/finance
// @access  Private
const createRecord = async (req, res) => {
  const { title, amount, type, category, date, description, status } = req.body;

  if (!title || !amount || !type || !category) {
    return res.status(400).json({ success: false, message: 'Required fields: title, amount, type, category' });
  }

  try {
    const record = await FinancialRecord.create({
      userId: req.user._id,
      title,
      amount,
      type,
      category,
      date,
      description,
      status,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's financial records
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

// @desc    Update a financial record
// @route   PUT /api/finance/:id
// @access  Private
const updateRecord = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Verify owner (or Admin)
    if (record.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this record' });
    }

    record.title = req.body.title || record.title;
    record.amount = req.body.amount !== undefined ? req.body.amount : record.amount;
    record.type = req.body.type || record.type;
    record.category = req.body.category || record.category;
    record.date = req.body.date || record.date;
    record.description = req.body.description || record.description;
    record.status = req.body.status || record.status;

    const updatedRecord = await record.save();
    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a financial record
// @route   DELETE /api/finance/:id
// @access  Private
const deleteRecord = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Verify owner
    if (record.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
    }

    await record.deleteOne();
    res.json({ success: true, message: 'Record removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRecord,
  getMyRecords,
  updateRecord,
  deleteRecord,
};
