const express = require('express');
const router = express.Router();
const {
  getAlbums,
  createAlbum,
  getAlbum,
  updateAlbum,
  deleteAlbum,
} = require('../controllers/albumsController');
const { protect } = require('../middleware/auth');

router.use(protect);                     // all album routes require auth

router.get('/',      getAlbums);
router.post('/',     createAlbum);
router.get('/:id',   getAlbum);
router.put('/:id',   updateAlbum);
router.delete('/:id', deleteAlbum);

module.exports = router;