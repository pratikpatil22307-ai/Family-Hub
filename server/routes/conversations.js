const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { getConversations, startConversation } = require('../controllers/conversationController');

/*
 * All conversation routes require a valid JWT.
 * `protect` populates req.user before any controller runs.
 * No route here is reachable without authentication.
 */

// GET /api/conversations
// Returns all DM threads for the authenticated user, newest first.
router.get('/', protect, getConversations);

// POST /api/conversations/start
// Body: { memberId: "<target_user_id>" }
// Gets or creates a DM thread between caller and target member.
router.post('/start', protect, startConversation);

module.exports = router;
