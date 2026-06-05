const Message = require('../models/Message');

// GET /api/messages — fetch last N messages for the family
const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await Message.find({ familyId: req.user.familyId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(messages.reverse()); // oldest first
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

module.exports = { getMessages };
