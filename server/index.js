require('dotenv').config();
const { validateAuthConfig } = require('./config/auth');
validateAuthConfig();

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

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const profiles = require('./routes/profileRoutes');
const { errorHandler } = require('./utils/http');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: CLIENT_URL,
  optionsSuccessStatus: 200,
};

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again in 5 minutes.', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', profiles.patients);
app.use('/api/doctors', profiles.doctors);
app.use('/api/doctors', profiles.discovery);
app.use('/api/admin', profiles.admin);

app.get('/', (req, res) => {
  res.json({ message: 'MediNova server is running' });
});
app.use(errorHandler);

connectDB().then(async () => {
  await require('./models/Department').init();
  await require('./models/Appointment').init();
  await require('./models/QueueState').init();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
