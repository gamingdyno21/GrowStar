const Admin = require('../models/Admin');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          token: generateToken(admin._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (clients)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user details with profile, records, and activity
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const records = await FinancialRecord.find({ userId: user._id }).sort({ date: -1 });
    const logs = await ActivityLog.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        profile: user,
        records,
        logs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user verification/approval status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    // Log this action
    await ActivityLog.create({
      userId: req.user._id,
      userType: 'Admin',
      action: `USER_${status.toUpperCase()}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Admin changed user status for ${user.email} to ${status}`,
    });

    res.json({ success: true, message: `User status updated to ${status}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const Message = require('../models/Message');

    // 1. Total Registered Clients
    const totalUsers = await User.countDocuments({ role: 'client', isDeleted: false });
    
    // 2. Active Investors (e.g. portfolio.totalInvested > 0 or has active holdings)
    const activeInvestors = await User.countDocuments({
      role: 'client',
      isDeleted: false,
      $or: [
        { 'portfolio.totalInvested': { $gt: 0 } },
        { activeInvestments: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    // Fetch all users to compute managed capital & profit
    const clients = await User.find({ role: 'client', isDeleted: false });
    
    // 3. Total Managed Capital
    const totalManagedCapital = clients.reduce((acc, curr) => acc + (curr.portfolio?.totalPortfolioValue || 0), 0);
    
    // 4. Today's Profit Updates
    const todaysProfitUpdates = clients.reduce((acc, curr) => acc + (curr.portfolio?.todaysProfit || 0), 0);

    // 5. Pending Client Messages (unread messages sent by Users)
    const pendingMessages = await Message.countDocuments({ receiverModel: 'Admin', isRead: false });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeInvestors,
        totalManagedCapital,
        todaysProfitUpdates,
        pendingMessages
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client portfolio stats
// @route   PUT /api/admin/users/:id/portfolio
// @access  Private/Admin
const updateUserPortfolio = async (req, res) => {
  const { totalInvested, currentProfit, totalPortfolioValue, totalWithdrawn, todaysProfit } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.portfolio = {
      totalInvested: totalInvested !== undefined ? Number(totalInvested) : user.portfolio.totalInvested,
      currentProfit: currentProfit !== undefined ? Number(currentProfit) : user.portfolio.currentProfit,
      totalPortfolioValue: totalPortfolioValue !== undefined ? Number(totalPortfolioValue) : user.portfolio.totalPortfolioValue,
      totalWithdrawn: totalWithdrawn !== undefined ? Number(totalWithdrawn) : user.portfolio.totalWithdrawn,
      todaysProfit: todaysProfit !== undefined ? Number(todaysProfit) : user.portfolio.todaysProfit
    };
    await user.save();
    res.json({ success: true, message: 'Portfolio summary updated successfully', data: user.portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add client active investment
// @route   POST /api/admin/users/:id/investments
// @access  Private/Admin
const addActiveInvestment = async (req, res) => {
  const { shareName, investedAmount, currentValue } = req.body;
  if (!shareName || investedAmount === undefined || currentValue === undefined) {
    return res.status(400).json({ success: false, message: 'Share Name, Invested Amount, and Current Value are required' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.activeInvestments.push({
      shareName,
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      lastUpdated: new Date()
    });
    await user.save();
    res.json({ success: true, message: 'Investment added successfully', data: user.activeInvestments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client active investment
// @route   PUT /api/admin/users/:id/investments/:invId
// @access  Private/Admin
const updateActiveInvestment = async (req, res) => {
  const { shareName, investedAmount, currentValue } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const investment = user.activeInvestments.id(req.params.invId);
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    if (shareName !== undefined) investment.shareName = shareName;
    if (investedAmount !== undefined) investment.investedAmount = Number(investedAmount);
    if (currentValue !== undefined) investment.currentValue = Number(currentValue);
    investment.lastUpdated = new Date();
    await user.save();
    res.json({ success: true, message: 'Investment updated successfully', data: user.activeInvestments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client active investment
// @route   DELETE /api/admin/users/:id/investments/:invId
// @access  Private/Admin
const deleteActiveInvestment = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.activeInvestments.pull(req.params.invId);
    await user.save();
    res.json({ success: true, message: 'Investment removed successfully', data: user.activeInvestments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add daily profit history entry
// @route   POST /api/admin/users/:id/daily-profit
// @access  Private/Admin
const addDailyProfit = async (req, res) => {
  const { date, profit } = req.body;
  if (profit === undefined) {
    return res.status(400).json({ success: false, message: 'Profit value is required' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.dailyProfitHistory.push({
      date: date || new Date(),
      profit: Number(profit)
    });
    // Sort profit history chronologically by date
    user.dailyProfitHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    await user.save();
    res.json({ success: true, message: 'Daily profit entry added successfully', data: user.dailyProfitHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete daily profit history entry
// @route   DELETE /api/admin/users/:id/daily-profit/:profitId
// @access  Private/Admin
const deleteDailyProfit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.dailyProfitHistory.pull(req.params.profitId);
    await user.save();
    res.json({ success: true, message: 'Daily profit entry removed successfully', data: user.dailyProfitHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add transaction directly for a client user
// @route   POST /api/admin/users/:id/transactions
// @access  Private/Admin
const addUserTransaction = async (req, res) => {
  const { title, amount, type, category, date, status, description } = req.body;
  if (!title || amount === undefined || !type || !category) {
    return res.status(400).json({ success: false, message: 'Required fields: title, amount, type, category' });
  }
  try {
    const record = await FinancialRecord.create({
      userId: req.params.id,
      title,
      amount: Number(amount),
      type,
      category,
      date: date || new Date(),
      status: status || 'Completed',
      description
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client transaction record
// @route   PUT /api/admin/users/:id/transactions/:transId
// @access  Private/Admin
const updateUserTransaction = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.transId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }
    record.title = req.body.title || record.title;
    record.amount = req.body.amount !== undefined ? Number(req.body.amount) : record.amount;
    record.type = req.body.type || record.type;
    record.category = req.body.category || record.category;
    record.date = req.body.date || record.date;
    record.status = req.body.status || record.status;
    record.description = req.body.description || record.description;
    
    await record.save();
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client transaction record
// @route   DELETE /api/admin/users/:id/transactions/:transId
// @access  Private/Admin
const deleteUserTransaction = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.transId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }
    await record.deleteOne();
    res.json({ success: true, message: 'Transaction record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client permanently
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete the user record
    await user.deleteOne();
    
    // Clean up user's financial records
    await FinancialRecord.deleteMany({ userId: req.params.id });
    
    // Clean up activity logs
    await ActivityLog.deleteMany({ userId: req.params.id });

    // Clean up messages
    await Message.deleteMany({ $or: [{ senderId: req.params.id }, { receiverId: req.params.id }] });

    res.json({ success: true, message: 'Client and all associated records permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
