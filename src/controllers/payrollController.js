const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// Helper to calculate tax based on monthly gross salary slabs
const calculateTax = (gross) => {
  const annualGross = gross * 12;
  let annualTax = 0;

  if (annualGross > 1200000) {
    annualTax = (annualGross - 1200000) * 0.15 + 30000;
  } else if (annualGross > 600000) {
    annualTax = (annualGross - 600000) * 0.05;
  }
  
  return parseFloat((annualTax / 12).toFixed(2));
};

// @desc    Generate payroll for an employee for a specific month/year
// @route   POST /api/payroll/generate
const generatePayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, otherDeductions = 0 } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide employeeId, month, and year' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if payroll already exists for this month/year
    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Payroll already generated for this month', data: existing });
    }

    const basic = employee.salary.basic;
    const allowances = employee.salary.allowances;
    const grossSalary = basic + allowances;

    // Calculate start and end date for the target month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Count unpaid leaves in this month
    const unpaidLeaves = await Leave.find({
      employee: employeeId,
      leaveType: 'unpaid',
      status: 'Approved',
      startDate: { $gte: startDate, $lte: endDate }
    });
    const totalUnpaidDays = unpaidLeaves.reduce((acc, curr) => acc + curr.totalDays, 0);
    
    // Per day salary deduction rate (assuming 30 days)
    const perDayRate = basic / 30;
    const unpaidLeaveDeduction = parseFloat((totalUnpaidDays * perDayRate).toFixed(2));

    // Count late check-ins or half days from attendance
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let lateCount = 0;
    attendanceRecords.forEach(att => {
      if (att.checkIn && att.checkIn.status === 'Late') lateCount++;
    });

    // Penalty: Every 3 late marks result in 0.5 day salary deduction
    const lateDeductionUnits = Math.floor(lateCount / 3) * 0.5;
    const lateDeduction = parseFloat((lateDeductionUnits * perDayRate).toFixed(2));

    const totalDeductions = unpaidLeaveDeduction + lateDeduction + Number(otherDeductions);
    const tax = calculateTax(grossSalary);
    const netSalary = parseFloat((grossSalary - totalDeductions - tax).toFixed(2));

    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      year,
      basicSalary: basic,
      allowances,
      deductions: {
        unpaidLeaveDeduction,
        lateDeduction,
        other: Number(otherDeductions)
      },
      tax,
      grossSalary,
      netSalary,
      status: 'Generated'
    });

    res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      data: payroll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payroll records (Admin/HR see all, Employee sees own)
// @route   GET /api/payroll
const getPayrolls = async (req, res, next) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    let query = {};

    if (month) query.month = month;
    if (year) query.year = year;

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.json({ success: true, count: 0, data: [] });
      query.employee = employee._id;
    }

    const total = await Payroll.countDocuments(query);
    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email department designation' }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      count: payrolls.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: payrolls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark payroll as Paid (Admin/HR only)
// @route   PATCH /api/payroll/:id/pay
const markPayrollPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    payroll.status = 'Paid';
    await payroll.save();

    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: payroll
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generatePayroll, getPayrolls, markPayrollPaid };