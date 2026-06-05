const Event = require('../models/Event');
const Message = require('../models/Message');
const Photo = require('../models/Photo');
const User = require('../models/User');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const familyId = req.user.familyId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [upcomingEvents, totalPhotos, todayMessages, memberCount, nextEvents] = await Promise.all([
      Event.countDocuments({ familyId, startDate: { $gte: now } }),
      Photo.countDocuments({ familyId }),
      Message.countDocuments({ familyId, timestamp: { $gte: todayStart, $lt: todayEnd } }),
      User.countDocuments({ familyId }),
      Event.find({ familyId, startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(3)
        .lean(),
    ]);

    res.json({
      upcomingEvents,
      totalPhotos,
      todayMessages,
      memberCount,
      nextEvents,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

module.exports = { getStats };
