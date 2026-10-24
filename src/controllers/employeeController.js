const User = require('../models/User');
const Employee = require('../models/Employee');
const crypto = require('crypto');

// @desc    Register a new employee (HR or Admin)
// @route   POST /api/employees
const registerEmployee = async (req, res, next) => {
  try {
    const { name, email, department, designation, employeeCode, salary, phone, address, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const existingCode = await Employee.findOne({ employeeCode });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Employee code already exists' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!';

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role || 'employee',
      department,
      designation,
      phone,
      isFirstLogin: true
    });

    const employee = await Employee.create({
      user: user._id,
      employeeCode,
      department,
      designation,
      salary: {
        basic: salary?.basic || 0,
        allowances: salary?.allowances || 0
      },
      phone,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        employee,
        temporaryPassword: tempPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees with pagination & search
// @route   GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      query.department = department;
    }

    if (req.user.role === 'employee') {
      const selfEmployee = await Employee.findOne({ user: req.user._id }).populate('user', '-password');
      return res.json({ success: true, count: 1, data: [selfEmployee] });
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('user', '-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee profile by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('user', '-password');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    if (req.user.role === 'employee' && employee.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view other employee records' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerEmployee, getEmployees, getEmployeeById };