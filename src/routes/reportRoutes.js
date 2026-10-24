const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getMonthlyReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin', 'hr'), getDashboardMetrics);
router.get('/monthly', protect, authorize('admin', 'hr'), getMonthlyReport);

module.exports = router;