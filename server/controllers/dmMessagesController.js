const mongoose = require('mongoose');
const DirectMessage = require('../models/DirectMessage');
const Conversation  = require('../models/Conversation');

/* ── Helpers ─────────────────────────────────────────────── */

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

/** Safely unwrap familyId whether it's a raw ObjectId or populated object. */
const getFamilyId = (user) => user.familyId?._id ?? user.familyId;

/**
 * Verify that the authenticated user is a participant in the conversation
 * AND that the conversation belongs to their family.
 * Returns the conversation document on success, null on failure.
 */
const authoriseConversation = async (conversationId, userId, familyId) => {
  return Conversation.findOne({
    _id:          conversationId,
    familyId,
    participants: userId,   // multikey index — user must be a participant
  });
};

/* ─────────────────────────────────────────────────────────────
   GET /api/messages/conversation/:conversationId
   Returns up to `limit` messages for a DM thread (oldest first).
   Query param: ?limit=50 (default 50, max 200)
───────────────────────────────────────────────────────────── */
const getDmMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId   = req.user._id;
    const familyId = getFamilyId(req.user);

    /* ── Validate conversationId ── */
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversationId.' });
    }

    /* ── Authorise: caller must be a participant ── */
    const convo = await authoriseConversation(conversationId, userId, familyId);
    if (!convo) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    /* ── Fetch messages ── */
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const messages = await DirectMessage.find({ conversationId })
      .sort({ timestamp: 1 })   // oldest first — natural reading order
      .limit(limit)
      .lean();

    return res.status(200).json(messages);
  } catch (err) {
    console.error('[getDmMessages]', err);
    return res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/messages/conversation/:conversationId
   Body: { content: "…" }
   Creates a new DM message and updates Conversation.lastMessageAt.
───────────────────────────────────────────────────────────── */
const sendDmMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content }        = req.body;
    const userId             = req.user._id;
    const familyId           = getFamilyId(req.user);

    /* ── Validate conversationId ── */
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversationId.' });
    }

    /* ── Validate content ── */
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ message: 'Message cannot exceed 1000 characters.' });
    }

    /* ── Authorise: caller must be a participant ── */
    const convo = await authoriseConversation(conversationId, userId, familyId);
    if (!convo) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    /* ── Create message ── */
    const message = await DirectMessage.create({
      conversationId,
      sender:     userId,
      senderName: req.user.name,
      content:    content.trim(),
      familyId,
    });

    /* ── Update conversation's lastMessageAt for inbox sorting ── */
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: message.timestamp,
    });

    return res.status(201).json(message);
  } catch (err) {
    console.error('[sendDmMessage]', err);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
};

module.exports = { getDmMessages, sendDmMessage };
