const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messagesController');
const { protect } = require('../middleware/auth');
const {
  getDmMessages,
  sendDmMessage,
} = require('../controllers/dmMessagesController');
router.use(protect);
router.get('/', getMessages);
router.get(
  '/conversation/:conversationId',
  protect,
  getDmMessages
);

router.post(
  '/conversation/:conversationId',
  protect,
  sendDmMessage
);
module.exports = router;
