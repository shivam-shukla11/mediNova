const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  symptoms: {
    type: String,
  },
  aiDepartment: {
    type: String,
  },
  aiPriority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
  },
  aiRecommendation: {
    type: String,
  },
  appointmentType: {
    type: String,
    enum: ['Normal', 'Emergency', 'Walkin'],
    default: 'Normal',
  },
  queuePosition: {
    type: Number,
  },
  estimatedWindowStart: {
    type: Date,
  },
  estimatedWindowEnd: {
    type: Date,
  },
  checkedIn: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Confirmed',
      'CancelledByPatient',
      'NoResponse',
      'CheckedIn',
      'Completed',
    ],
    default: 'Pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
