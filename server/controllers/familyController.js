const User = require('../models/User');
const Family = require('../models/Family');

// GET /api/family/members — list all members in the same family
const getMembers = async (req, res) => {
  try {
    const members = await User.find({ familyId: req.user.familyId }).select('-password').sort({ createdAt: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch family members' });
  }
};

// GET /api/family/info
const getFamilyInfo = async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    if (!family) return res.status(404).json({ message: 'Family not found' });
    res.json(family);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch family info' });
  }
};

module.exports = { getMembers, getFamilyInfo };
