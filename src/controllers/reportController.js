const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');

// Helper to get today's date string YYYY-MM-DD
const getTodayDateStr = () => new Date().toISOString().split('T')[0];

// @desc    Get dashboard metrics & summary (Admin/HR only)
// @route   GET /api/reports/dashboard
const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = getTodayDateStr();

    const totalEmployees = await Employee.countDocuments();
    const presentToday = await Attendance.countDocuments({ date: today, status: { $in: ['Checked-In', 'Checked-Out'] } });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Calculate current month's payroll expenditure
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const payrolls = await Payroll.find({ month: currentMonth, year: currentYear });
    const totalPayrollExpense = payrolls.reduce((acc, curr) => acc + curr.netSalary, 0);

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          totalPayrollExpense: parseFloat(totalPayrollExpense.toFixed(2)),
          generatedCount: payrolls.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly summary report (Attendance, Leaves, Payroll)
// @route   GET /api/reports/monthly
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide month and year query parameters' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const payrolls = await Payroll.find({ month: m, year: y })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email department designation' }
      });

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const totalLeavesInMonth = await Leave.countDocuments({
      status: 'Approved',
      startDate: { $gte: startDate, $lte: endDate }
    });

    res.json({
      success: true,
      reportPeriod: { month: m, year: y },
      summary: {
        totalPayrollsProcessed: payrolls.length,
        approvedLeavesCount: totalLeavesInMonth
      },
      payrolls
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardMetrics, getMonthlyReport };