const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  medicines: {
    type: String, // can be upgraded to Array of Objects later if needed
    required: true,
  },
  dosage: {
    type: String,
  },
  recommendations: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
