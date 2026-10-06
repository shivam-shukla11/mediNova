const Doctor = require('../models/Doctor');
const Counter = require('../models/Counter');

exports.nextDoctorId = async (departmentName) => {
  const prefix = departmentName.slice(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '') || 'doc';
  const key = `doctor:${prefix}`;
  // Seed from legacy IDs, including departments that share an abbreviation.
  const existing = await Doctor.find({ doctorId: new RegExp(`^${prefix}_[0-9]+$`) })
    .select('doctorId').lean();
  const maximum = existing.reduce((max, doctor) => Math.max(max, Number(doctor.doctorId.split('_')[1])), 0);
  try {
    await Counter.updateOne({ _id: key }, { $max: { value: maximum } }, { upsert: true });
  } catch (error) {
    // Two first registrations can race to seed the same unique counter.
    if (error.code !== 11000) throw error;
    await Counter.updateOne({ _id: key }, { $max: { value: maximum } });
  }
  const counter = await Counter.findOneAndUpdate({ _id: key }, { $inc: { value: 1 } }, { new: true });
  return `${prefix}_${String(counter.value).padStart(3, '0')}`;
};
