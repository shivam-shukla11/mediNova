const mongoose = require('mongoose');

// Writing one doctor/day document serializes simultaneous booking/status changes.
const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('QueueState', schema);
