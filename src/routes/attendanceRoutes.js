const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getAttendance);

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

module.exports = router;