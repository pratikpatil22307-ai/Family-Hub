const mongoose = require('mongoose');

/**
 * DirectMessage
 * ─────────────────────────────────────────────────────────────
 * Stores messages that belong to a DM Conversation thread.
 * Kept separate from the family-chat Message model so existing
 * family-chat behaviour is completely untouched.
 */
const directMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'conversationId is required'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Primary query: all messages for a conversation, oldest-first
directMessageSchema.index({ conversationId: 1, timestamp: 1 });

// Allows scoping to a family as a safety net (matches Conversation.familyId)
directMessageSchema.index({ familyId: 1, conversationId: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
