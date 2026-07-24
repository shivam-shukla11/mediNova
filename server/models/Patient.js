const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  bloodGroup: {
    type: String,
  },
  address: {
    type: String,
  },
  medicalHistory: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
