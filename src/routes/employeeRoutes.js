const express = require('express');
const router = express.Router();
const { registerEmployee, getEmployees, getEmployeeById } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getEmployees)
  .post(protect, authorize('admin', 'hr'), registerEmployee);

router.route('/:id')
  .get(protect, getEmployeeById);

module.exports = router;