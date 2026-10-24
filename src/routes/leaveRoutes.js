const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getLeaves)
  .post(protect, applyLeave);

router.patch('/:id/status', protect, authorize('admin', 'hr'), updateLeaveStatus);

module.exports = router;