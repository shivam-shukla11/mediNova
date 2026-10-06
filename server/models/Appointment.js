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
  clinicDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  activeBookingKey: { type: String },
  confirmationStatus: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'NoResponse'],
    default: 'NoResponse',
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

appointmentSchema.index({ activeBookingKey: 1 }, { unique: true, sparse: true });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
