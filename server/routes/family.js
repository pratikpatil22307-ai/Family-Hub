const express = require('express');
const router = express.Router();
const { getMembers, getFamilyInfo } = require('../controllers/familyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/members', getMembers);
router.get('/info', getFamilyInfo);

module.exports = router;
