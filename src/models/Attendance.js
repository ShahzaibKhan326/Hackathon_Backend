const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkIn: {
    time: { type: Date },
    status: { 
      type: String, 
      enum: ['Present', 'Late', 'Half-Day', 'Absent'], 
      default: 'Present' 
    },
    source: { type: String, enum: ['web', 'camera'], default: 'web' },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  checkOut: {
    time: { type: Date },
    totalHours: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['Checked-In', 'Checked-Out', 'Missing-Checkout', 'Absent'],
    default: 'Checked-In'
  }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);