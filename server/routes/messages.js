const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messagesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getMessages);

module.exports = router;
