const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: 'Untitled',
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  filename: { type: String },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedByName: { type: String },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  albumId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Album',
  default: null,
 },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

photoSchema.index({ familyId: 1, uploadedAt: -1 });

module.exports = mongoose.model('Photo', photoSchema);
