const mongoose = require('mongoose');

// Internal sequence bookkeeping; not a new hospital-domain entity.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  value: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
