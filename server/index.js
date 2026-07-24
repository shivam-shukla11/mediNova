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
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'MediNova server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
