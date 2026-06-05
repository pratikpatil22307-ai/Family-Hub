// events.js
const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
