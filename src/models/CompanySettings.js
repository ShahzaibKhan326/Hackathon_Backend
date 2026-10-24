const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true, default: 'Saylani HCM Enterprise' },
  officeStart: { type: String, default: '09:00' },
  graceMinutes: { type: Number, default: 15 },
  halfDayHours: { type: Number, default: 5 },
  weekends: { type: [String], default: ['Saturday', 'Sunday'] }
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);