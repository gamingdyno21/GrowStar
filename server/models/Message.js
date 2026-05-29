const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['Withdrawal Request', 'Deposit Confirmation', 'Support Query'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    reply: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Replied', 'Resolved'],
      default: 'Pending'
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
