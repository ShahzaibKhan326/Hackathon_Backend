const express = require('express');
const router = express.Router();
const { generatePayroll, getPayrolls, markPayrollPaid } = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getPayrolls);

router.post('/generate', protect, authorize('admin', 'hr'), generatePayroll);
router.patch('/:id/pay', protect, authorize('admin', 'hr'), markPayrollPaid);

module.exports = router;