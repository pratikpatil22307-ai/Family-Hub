const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
// ── ADDED: need Album model to validate albumId ownership ──
const Album = require('../models/Album');

// GET /api/photos
// MODIFIED: optional ?albumId= filter; ?albumId=none for unassigned photos
const getPhotos = async (req, res) => {
  try {
    // Build query — always scoped to the user's family (UNCHANGED)
    const query = { familyId: req.user.familyId };

    // ADDED: optional album filter
    if (req.query.albumId) {
      if (req.query.albumId === 'none') {
        // "Unassigned" — photos with no album
        query.albumId = null;
      } else {
        query.albumId = req.query.albumId;
      }
    }
    // If no albumId query param → query stays as { familyId } → returns ALL photos (original behaviour)

    const photos = await Photo.find(query).sort({ uploadedAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch photos' });
  }
};

// POST /api/photos
// MODIFIED: accepts optional albumId in form body; validates it belongs to the family
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    // ADDED: optional albumId — validate ownership if provided
    let albumId = null;
    if (req.body.albumId && req.body.albumId !== 'null') {
      const album = await Album.findOne({
        _id: req.body.albumId,
        familyId: req.user.familyId,        // must belong to same family
      });
      if (!album) {
        return res.status(400).json({ message: 'Invalid album' });
      }
      albumId = album._id;
    }

   const imageUrl = req.file.path;
    const photo = await Photo.create({
      title: req.body.title?.trim() || req.file.originalname,
      imageUrl,
      filename: req.file.filename || null,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      familyId: req.user.familyId,
      albumId,                              // ADDED: null if not provided (original behaviour)
    });

    res.status(201).json(photo);
  } catch (err) {
  console.error('PHOTO UPLOAD ERROR:', err);

  res.status(500).json({
    message: 'Failed to upload photo',
    error: err.message
  });
}
};

// DELETE /api/photos/:id  — UNCHANGED
const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

   if (photo.imageUrl && photo.imageUrl.includes('cloudinary')) {
  try {
    const publicId = photo.imageUrl
      .split('/upload/')[1]
      .split('/')
      .slice(1)
      .join('/')
      .replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}

    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete photo' });
  }
};

module.exports = { getPhotos, uploadPhoto, deletePhoto };