const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  experience: {
    type: Number, // years
    default: 0,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  shiftStart: {
    type: String, // e.g. "09:00"
    required: true,
  },
  shiftEnd: {
    type: String, // e.g. "15:00"
    required: true,
  },
  avgConsultationTime: {
    type: Number, // in minutes, learned/updated over time
    default: 15,
  },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
