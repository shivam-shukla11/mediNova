require('./models/User');
require('./models/Patient');
require('./models/Doctor');
require('./models/Department');
require('./models/Appointment');
require('./models/Prescription');
require('./models/Bill');
require('./models/NoShowPrediction');
require('./models/DoctorLeave');
console.log('All models loaded successfully');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: CLIENT_URL,
  optionsSuccessStatus: 200,
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MediNova server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
