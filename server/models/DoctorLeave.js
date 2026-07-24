const mongoose = require('mongoose');

const doctorLeaveSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('DoctorLeave', doctorLeaveSchema);
