const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');

dotenv.config();

connectDB().then(async () => {
  await seedAdmin();
});

const app = express();

app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'HCM Lite API is running...' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});