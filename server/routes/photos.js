const express = require('express');
const router = express.Router();
const { getPhotos, uploadPhoto, deletePhoto } = require('../controllers/photosController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', getPhotos);
router.post('/', upload.single('image'), uploadPhoto);
router.delete('/:id', deletePhoto);

module.exports = router;
