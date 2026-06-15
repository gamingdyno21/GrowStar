const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    panNumber: { type: String, required: true, unique: true },
    aadhaarNumber: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    profilePic: { type: String, default: "" },
    dob: { type: String, default: "" },
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" }
    },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    role: { type: String, default: 'client' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
    portfolio: {
      totalInvested: { type: Number, default: 0 },
      currentProfit: { type: Number, default: 0 },
      totalPortfolioValue: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 },
      todaysProfit: { type: Number, default: 0 }
    },
    activeInvestments: [
      {
        shareName: { type: String, required: true },
        investedAmount: { type: Number, required: true },
        currentValue: { type: Number, required: true },
        lastUpdated: { type: Date, default: Date.now }
      }
    ],
    dailyProfitHistory: [
      {
        date: { type: Date, default: Date.now },
        profit: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
