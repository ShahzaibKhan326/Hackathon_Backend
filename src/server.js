const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');

// 1. Load Environment Variables
dotenv.config();

// 2. Connect to MongoDB & Seed Initial Admin
connectDB().then(async () => {
  await seedAdmin();
});

const app = express();

// 3. Global Middleware
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. Mount Route Modules
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// 5. Root Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'HCM Lite API is running...' });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 7. Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});