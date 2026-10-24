const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const CompanySettings = require('../models/CompanySettings');

// Helper to count working days (skipping weekends)
const calculateWorkingDays = (start, end, weekends = ['Saturday', 'Sunday']) => {
  let count = 0;
  let curDate = new Date(start);
  const lastDate = new Date(end);

  while (curDate <= lastDate) {
    const dayName = curDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!weekends.includes(dayName)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

// @desc    Apply for leave
// @route   POST /api/leaves
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required leave fields' });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(422).json({ success: false, message: 'You already have a pending or approved leave request during these dates' });
    }

    const settings = await CompanySettings.findOne() || { weekends: ['Saturday', 'Sunday'] };
    const totalDays = calculateWorkingDays(start, end, settings.weekends);

    if (totalDays <= 0) {
      return res.status(400).json({ success: false, message: 'Leave duration must include at least one working day' });
    }

    // Quota check (Annual: 14, Sick: 8, Casual: 10, Unpaid: unlimited)
    const quotas = { annual: 14, sick: 8, casual: 10, unpaid: Infinity };
    if (leaveType !== 'unpaid') {
      // Calculate already approved leaves of this type in the current year
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const approvedLeaves = await Leave.find({
        employee: employee._id,
        leaveType,
        status: 'Approved',
        startDate: { $gte: yearStart, $lte: yearEnd }
      });

      const usedQuota = approvedLeaves.reduce((acc, curr) => acc + curr.totalDays, 0);
      const maxQuota = quotas[leaveType];

      if (usedQuota + totalDays > maxQuota) {
        return res.status(422).json({ 
          success: false, 
          message: `Quota exceeded for ${leaveType} leave. Allowed: ${maxQuota}, Used: ${usedQuota}, Requested: ${totalDays}` 
        });
      }
    }

    const leave = await Leave.create({
      employee: employee._id,
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave requests (HR/Admin see all, Employee sees own)
// @route   GET /api/leaves
const getLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.json({ success: true, count: 0, data: [] });
      query.employee = employee._id;
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email department designation' }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject leave (HR/Admin only)
// @route   PATCH /api/leaves/:id/status
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leave.status}` });
    }

    leave.status = status;
    leave.actionBy = req.user._id;
    if (comment) leave.comment = comment;

    await leave.save();

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyLeave, getLeaves, updateLeaveStatus };