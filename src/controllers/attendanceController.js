const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const CompanySettings = require('../models/CompanySettings');

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const checkIn = async (req, res, next) => {
  try {
    const { source, location } = req.body;
    
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found for this user' });
    }

    const today = getTodayDateStr();

    const existingAttendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (existingAttendance) {
      return res.status(409).json({ 
        success: false, 
        message: 'Already checked in for today',
        data: existingAttendance 
      });
    }

    const settings = await CompanySettings.findOne() || { officeStart: '09:00', graceMinutes: 15 };
    
    const now = new Date();
    const [officeHours, officeMinutes] = settings.officeStart.split(':').map(Number);
    const officeStartTime = new Date(now);
    officeStartTime.setHours(officeHours, officeMinutes + settings.graceMinutes, 0, 0);

    let attendanceStatus = 'Present';
    if (now > officeStartTime) {
      attendanceStatus = 'Late';
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      user: req.user._id,
      date: today,
      checkIn: {
        time: now,
        status: attendanceStatus,
        source: source || 'web',
        location: location || {}
      },
      status: 'Checked-In'
    });

    res.status(201).json({
      success: true,
      message: `Checked in successfully as ${attendanceStatus}`,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const today = getTodayDateStr();
    const attendance = await Attendance.findOne({ employee: employee._id, date: today });

    if (!attendance || attendance.status !== 'Checked-In') {
      return res.status(400).json({ success: false, message: 'No active check-in found for today' });
    }

    const now = new Date();
    const checkInTime = new Date(attendance.checkIn.time);
    const diffHours = (now - checkInTime) / (1000 * 60 * 60);

    let checkInStatus = attendance.checkIn.status;
    if (diffHours < 5) {
      checkInStatus = 'Half-Day';
    }

    attendance.checkOut = {
      time: now,
      totalHours: parseFloat(diffHours.toFixed(2))
    };
    attendance.checkIn.status = checkInStatus;
    attendance.status = 'Checked-Out';

    await attendance.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { date, department, page = 1, limit = 10 } = req.query;
    let query = {};

    if (date) query.date = date;

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.json({ success: true, count: 0, data: [] });
      query.employee = employee._id;
    } else if (department) {
      const deptEmployees = await Employee.find({ department }).select('_id');
      query.employee = { $in: deptEmployees.map(e => e._id) };
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email department designation' }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getAttendance };