const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    enum: ['Vacation', 'Birthday', 'Anniversary', 'Trip', 'Get-together', 'Other'],
    default: 'Other',
  },
  subCategory: { type: String, trim: true },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: { type: Date },
  location: { type: String, trim: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByName: { type: String },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for family-scoped queries
eventSchema.index({ familyId: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
