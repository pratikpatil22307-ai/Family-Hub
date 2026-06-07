const Album = require('../models/Album');
const Photo = require('../models/Photo');

// GET /api/albums
const getAlbums = async (req, res) => {
  try {
    const albums = await Album.find({ familyId: req.user.familyId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    res.json(albums);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch albums' });
  }
};

// POST /api/albums
const createAlbum = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Album name is required' });
    }
    const album = await Album.create({
      name: name.trim(),
      description: description?.trim() || '',
      familyId: req.user.familyId,
      createdBy: req.user._id,
    });
    await album.populate('createdBy', 'name');
    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create album' });
  }
};

// GET /api/albums/:id
const getAlbum = async (req, res) => {
  try {
    const album = await Album.findOne({
      _id: req.params.id,
      familyId: req.user.familyId,         // family scoping enforced
    }).populate('createdBy', 'name');
    if (!album) return res.status(404).json({ message: 'Album not found' });
    res.json(album);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch album' });
  }
};

// PUT /api/albums/:id
const updateAlbum = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Album name is required' });
    }
    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, familyId: req.user.familyId },
      { name: name.trim(), description: description?.trim() || '' },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');
    if (!album) return res.status(404).json({ message: 'Album not found' });
    res.json(album);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update album' });
  }
};

// DELETE /api/albums/:id
// Does NOT delete photos — orphans them back to "All Photos" (albumId → null)
const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findOne({
      _id: req.params.id,
      familyId: req.user.familyId,
    });
    if (!album) return res.status(404).json({ message: 'Album not found' });

    // Unlink photos — they remain in the family, just no longer in an album
    await Photo.updateMany(
      { albumId: album._id, familyId: req.user.familyId },
      { $set: { albumId: null } }
    );

    await album.deleteOne();
    res.json({ message: 'Album deleted. Photos moved to All Photos.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete album' });
  }
};

module.exports = { getAlbums, createAlbum, getAlbum, updateAlbum, deleteAlbum };