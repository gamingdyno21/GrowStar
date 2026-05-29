const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Income', 'Expense', 'Investment', 'Transfer', 'Deposit', 'Withdrawal'], required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' },
    description: { type: String },
  },
  { timestamps: true }
);

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);
module.exports = FinancialRecord;
