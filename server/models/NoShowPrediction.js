const mongoose = require('mongoose');

const noShowPredictionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  riskScore: {
    type: Number, // 0 to 1
    min: 0,
    max: 1,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  confirmationStatus: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'NoResponse'],
    default: 'NoResponse',
  },
  predictedOn: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('NoShowPrediction', noShowPredictionSchema);
