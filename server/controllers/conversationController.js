const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Return true if `id` is a valid MongoDB ObjectId string.
 * Used to reject garbage input before it ever reaches Mongoose.
 */
const isValidObjectId = (id) => mongoose.isValidObjectId(id);

/**
 * Safely extract a plain string family ID regardless of whether
 * req.user.familyId is a populated object or a raw ObjectId.
 * auth.js populates familyId with { familyName, inviteCode }, so
 * we use ._id when it's an object.
 */
const getFamilyId = (user) =>
  user.familyId?._id ?? user.familyId;

/* ─────────────────────────────────────────────────────────────────
   GET /api/conversations
   Returns all DM threads the authenticated user participates in,
   scoped to their family, sorted newest-activity-first.
   Participants list returned to the frontend excludes the caller
   so the UI can display "the other person" without extra filtering.
───────────────────────────────────────────────────────────────── */
const getConversations = async (req, res) => {
  try {
    const userId   = req.user._id;
    const familyId = getFamilyId(req.user);

    const conversations = await Conversation.find({
      familyId,               // ← scoped to caller's family only
      participants: userId,   // ← multikey index hit; only threads they're in
    })
      .populate({
        path: 'participants',
        select: 'name avatar _id',  // never expose email / password hash
      })
      .sort({ lastMessageAt: -1 }) // most-recent activity first
      .lean();                      // plain JS objects — faster for read-only

    /*
     * Strip the caller from each participants array.
     * The frontend only needs to know "who am I talking to",
     * not the full pair. Doing this server-side keeps the response
     * clean and avoids the client having to know its own ID.
     */
    const callerIdStr = userId.toString();

    const shaped = conversations.map((convo) => ({
      ...convo,
      participants: convo.participants.filter(
        (p) => p._id.toString() !== callerIdStr
      ),
    }));

    return res.status(200).json(shaped);
  } catch (err) {
    console.error('[getConversations]', err);
    return res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/conversations/start
   Body: { memberId: "<target_user_id>" }

   Gets or creates a DM thread between the caller and memberId.
   All security checks run before any DB write:
     1. memberId is a valid ObjectId
     2. memberId !== caller (no self-DMs)
     3. Target user exists AND is in the same family
   The Conversation.findOrCreate static handles duplicate prevention
   atomically via upsert, so concurrent requests are safe.
───────────────────────────────────────────────────────────────── */
const startConversation = async (req, res) => {
  try {
    const { memberId } = req.body;
    const callerId = req.user._id;
    const familyId = getFamilyId(req.user);

    /* ── Guard 1: memberId present and well-formed ── */
    if (!memberId) {
      return res.status(400).json({ message: 'memberId is required.' });
    }

    if (!isValidObjectId(memberId)) {
      return res.status(400).json({ message: 'memberId is not a valid ID.' });
    }

    /* ── Guard 2: no self-conversations ── */
    if (memberId.toString() === callerId.toString()) {
      return res.status(400).json({ message: 'You cannot start a conversation with yourself.' });
    }

    /* ── Guard 3: target user must exist within the same family ──
     * This is the critical cross-family isolation check.
     * Querying with BOTH _id AND familyId means a user from a
     * different family supplying a valid memberId from their own
     * family gets a 404, not a 403 — we don't leak that the target
     * user exists at all.
     */
console.log('req.user.familyId =', req.user.familyId);
console.log('familyId =', familyId);
console.log('memberId =', memberId);
    const targetUser = await User.findOne({
      _id: memberId,
      familyId,           // ← must be the same family as the caller
    }).select('_id name avatar');

    if (!targetUser) {
      return res.status(404).json({
        message: 'Family member not found.',
      });
    }

    /* ── Create or fetch existing conversation (atomic upsert) ── */
    const conversation = await Conversation.findOrCreate({
      familyId,
      userA: callerId,
      userB: targetUser._id,
    });

    /* ── Populate participants for the response ── */
    await conversation.populate({
      path: 'participants',
      select: 'name avatar _id',
    });

    /* ── Shape response: exclude caller from participants list ── */
    const callerIdStr = callerId.toString();
    const shaped = {
      ...conversation.toObject(),
      participants: conversation.participants.filter(
        (p) => p._id.toString() !== callerIdStr
      ),
    };

    /*
     * 200 if the conversation already existed, 201 if we just created it.
     * Mongoose doesn't expose "was this an upsert insert?" directly, so
     * we compare createdAt ≈ now (within 2 seconds) as a reliable signal.
     */
    const isNew = Date.now() - new Date(conversation.createdAt).getTime() < 2000;
    return res.status(isNew ? 201 : 200).json(shaped);
  } catch (err) {
    console.error('[startConversation]', err);

    // The unique index fires if findOrCreate races — catch it gracefully.
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'A conversation with this member already exists.',
      });
    }

    return res.status(500).json({ message: 'Failed to start conversation.' });
  }
};

module.exports = { getConversations, startConversation };
