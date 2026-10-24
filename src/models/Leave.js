const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { 
    type: String, 
    enum: ['annual', 'sick', 'casual', 'unpaid'], 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
    default: 'Pending' 
  },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);