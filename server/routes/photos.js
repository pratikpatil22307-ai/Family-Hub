const express = require('express');
const router = express.Router();
const { getPhotos, uploadPhoto, deletePhoto } = require('../controllers/photosController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', getPhotos);
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, function (err) {

    if (err) {
      console.error('MULTER ERROR:', err);

      return res.status(500).json({
        message: 'Multer failed',
        error: err.message
      });
    }

    next();
  });
}, uploadPhoto);
router.delete('/:id', deletePhoto);

module.exports = router;
