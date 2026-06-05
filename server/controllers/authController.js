const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Family = require('../models/Family');

const generateToken = (userId, name, familyId) => {
  return jwt.sign({ userId, name, familyId: familyId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, action, familyName, inviteCode } = req.body;

    // Validate required fields
    if (!name || !email || !password || !action) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    let family;

    if (action === 'create') {
      // Create new family
      if (!familyName) return res.status(400).json({ message: 'Family name is required' });
      family = await Family.create({ familyName: familyName.trim() });
    } else if (action === 'join') {
      // Join existing family by invite code
      if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });
      family = await Family.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (!family) return res.status(404).json({ message: 'Invalid invite code — family not found' });
    } else {
      return res.status(400).json({ message: 'action must be "create" or "join"' });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      familyId: family._id,
      role: action === 'create' ? 'admin' : 'member',
    });

    // Set createdBy on family if newly created
    if (action === 'create') {
      family.createdBy = user._id;
      await family.save();
    }

    const token = generateToken(user._id, user.name, family._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyId: family._id,
        familyName: family.familyName,
        inviteCode: family.inviteCode,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const family = await Family.findById(user.familyId);
    const token = generateToken(user._id, user.name, user.familyId);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        familyName: family?.familyName || '',
        inviteCode: family?.inviteCode || '',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      familyId: req.user.familyId,
      familyName: family?.familyName || '',
      inviteCode: family?.inviteCode || '',
      createdAt: req.user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };
