const mongoose = require('mongoose');

/**
 * Conversation
 * ─────────────────────────────────────────────────────────────────
 * Represents a direct-message thread between two family members.
 *
 * Design decisions:
 *
 *  1. Kept completely separate from the Message model so Family Chat
 *     is untouched. DM messages will reference this Conversation._id
 *     via a `conversationId` field added to Message later (or in a
 *     separate DirectMessage model — your call).
 *
 *  2. `participants` is a fixed-length 2-element array. Enforced by
 *     the validator below. Family group chat uses familyId; DMs use
 *     exactly two participants.
 *
 *  3. `familyId` is required so you can always scope a conversation
 *     to one family and prevent cross-family DMs at the query level,
 *     not just in application code.
 *
 *  4. `lastMessageAt` is stored here (not derived from messages) so
 *     inbox queries can sort threads cheaply without a $lookup or
 *     aggregation pipeline every time.
 */
const conversationSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: [true, 'familyId is required'],
    },

    /**
     * Exactly two User references — the two people in the DM thread.
     * Order doesn't matter; queries use $all so {A,B} === {B,A}.
     */
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      validate: {
        validator(arr) {
          // Must have exactly 2 distinct participants
          if (!Array.isArray(arr) || arr.length !== 2) return false;
          return arr[0].toString() !== arr[1].toString();
        },
        message: 'A conversation must have exactly 2 distinct participants.',
      },
    },

    /**
     * Denormalised timestamp of the most recent message.
     * Updated by the send-message handler; allows inbox sort by
     * recency with a simple index scan instead of an aggregation.
     * Defaults to createdAt so new conversations sort correctly
     * before any message is sent.
     */
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt managed by Mongoose
  }
);

/* ── Indexes ──────────────────────────────────────────────────────
 *
 *  1. { participants: 1, familyId: 1 }  — compound, multikey
 *     The most important index. Covers the two core queries:
 *
 *       a) "Find the conversation between user A and user B in family F"
 *          db.conversations.findOne({
 *            familyId: F,
 *            participants: { $all: [A, B] }
 *          })
 *          MongoDB uses the multikey index on `participants` with the
 *          familyId equality predicate to home in on just this family's
 *          threads, then applies $all in memory on a tiny result set.
 *
 *       b) "Fetch all DM threads for user A in family F" (inbox)
 *          db.conversations.find({
 *            familyId: F,
 *            participants: A
 *          })
 *
 *     Without this index both queries do a full collection scan.
 *
 *  2. { lastMessageAt: -1 }  — descending single-field
 *     Covers ORDER BY lastMessageAt DESC when rendering an inbox
 *     sorted by most-recent activity. Descending because you almost
 *     always want newest-first.
 *
 *  3. { participants: 1, familyId: 1 }  unique: true
 *     Prevents duplicate conversation documents for the same pair.
 *     Because `participants` is an array MongoDB stores one index
 *     entry per element, so uniqueness here means "no two documents
 *     share both participant ids within the same family", which is
 *     exactly what you want.
 *     Note: use `findOneAndUpdate` with `upsert: true` in your route
 *     to safely get-or-create a conversation without a race condition.
 */
conversationSchema.index(
  { participants: 1, familyId: 1 },
  {
    unique: true,
    name: 'participants_familyId_unique',
    // Partial filter so the unique constraint only applies to
    // documents that have exactly 2 participants (future-proofs
    // group DMs if you ever extend this schema).
    partialFilterExpression: { 'participants.1': { $exists: true } },
  }
);

conversationSchema.index(
  { lastMessageAt: -1 },
  { name: 'lastMessageAt_desc' }
);

/* ── Static helper ────────────────────────────────────────────────
 *
 * Conversation.findOrCreate({ familyId, userA, userB })
 *
 * Atomically returns an existing conversation or creates a new one.
 * Using this instead of a plain `create()` call avoids duplicates
 * even under concurrent requests (the unique index is the hard
 * safety net; this is the soft, application-level guard).
 *
 * Usage in your DM route:
 *   const convo = await Conversation.findOrCreate({
 *     familyId: req.user.familyId,
 *     userA: req.user._id,
 *     userB: req.params.memberId,
 *   });
 */
conversationSchema.statics.findOrCreate = async function ({
  familyId,
  userA,
  userB,
}) {
  // First try to find existing conversation
  let conversation = await this.findOne({
    familyId,
    participants: { $all: [userA, userB] },
  });

  if (conversation) {
    return conversation;
  }

  // Create new conversation
  conversation = await this.create({
    familyId,
    participants: [userA, userB],
    lastMessageAt: new Date(),
  });

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
