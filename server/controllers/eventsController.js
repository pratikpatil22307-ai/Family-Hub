const Event = require('../models/Event');

// GET /api/events
const getEvents = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { familyId: req.user.familyId };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, category, subCategory, startDate, endDate, location } = req.body;
    if (!title || !startDate) return res.status(400).json({ message: 'Title and start date are required' });

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim(),
      category: category || 'Other',
      subCategory: subCategory?.trim(),
      startDate,
      endDate: endDate || null,
      location: location?.trim(),
      createdBy: req.user._id,
      createdByName: req.user.name,
      familyId: req.user.familyId,
    });

    res.status(201).json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { title, description, category, subCategory, startDate, endDate, location } = req.body;
    if (title) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (category) event.category = category;
    if (subCategory !== undefined) event.subCategory = subCategory.trim();
    if (startDate) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate || null;
    if (location !== undefined) event.location = location.trim();

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
