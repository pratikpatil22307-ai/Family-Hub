const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');

// GET /api/photos
const getPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ familyId: req.user.familyId }).sort({ uploadedAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch photos' });
  }
};

// POST /api/photos
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const photo = await Photo.create({
      title: req.body.title?.trim() || req.file.originalname,
      imageUrl,
      filename: req.file.filename,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      familyId: req.user.familyId,
    });

    res.status(201).json(photo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload photo' });
  }
};

// DELETE /api/photos/:id
const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Delete file from disk
    if (photo.filename) {
      const filePath = path.join(__dirname, '../uploads', photo.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete photo' });
  }
};

module.exports = { getPhotos, uploadPhoto, deletePhoto };
