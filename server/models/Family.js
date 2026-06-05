const mongoose = require('mongoose');
const crypto = require('crypto');

const familySchema = new mongoose.Schema({
  familyName: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
    minlength: [2, 'Family name must be at least 2 characters'],
    maxlength: [60, 'Family name cannot exceed 60 characters'],
  },
  inviteCode: {
    type: String,
    unique: true,
    uppercase: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate invite code before saving
familySchema.pre('save', function (next) {
  if (!this.inviteCode) {
    // Format: WORD-XXXX (e.g. PATIL-7X9A)
    const namePart = this.familyName
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 6);
    const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    this.inviteCode = `${namePart}-${randPart}`;
  }
  next();
});

module.exports = mongoose.model('Family', familySchema);
