const Message = require('../models/Message');

// @desc    Send a message (Client)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({ success: false, message: 'Type and message content are required' });
  }

  try {
    const newMessage = await Message.create({
      userId: req.user._id,
      type,
      message,
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get message history (Client)
// @route   GET /api/messages
// @access  Private
const getClientMessages = async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages (Admin)
// @route   GET /api/messages/admin
// @access  Private/Admin
const getAdminMessages = async (req, res) => {
  try {
    const messages = await Message.find({})
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a message (Admin)
// @route   PUT /api/messages/admin/:id/reply
// @access  Private/Admin
const replyMessage = async (req, res) => {
  const { reply } = req.body;
  if (!reply) {
    return res.status(400).json({ success: false, message: 'Reply content is required' });
  }

  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.reply = reply;
    message.status = 'Replied';
    await message.save();

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark message as resolved (Admin)
// @route   PUT /api/messages/admin/:id/resolve
// @access  Private/Admin
const resolveMessage = async (req, res) => {
  console.log("Resolve request:", req.params.id);
  try {
    const ticketId = req.params.id;
    const message = await Message.findByIdAndUpdate(ticketId, {
      status: "Resolved",
      resolvedAt: new Date()
    }, { new: true });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({
      success: true,
      message: "Ticket resolved successfully"
    });
  } catch (error) {
    console.error("Resolve error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getClientMessages,
  getAdminMessages,
  replyMessage,
  resolveMessage,
};
