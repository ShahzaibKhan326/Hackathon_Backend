const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  dateOfJoining: { type: Date, required: true, default: Date.now },
  salary: {
    basic: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0 }
  },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  emergencyContact: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);