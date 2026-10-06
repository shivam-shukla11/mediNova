const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorLeave = require('../models/DoctorLeave');
const { HttpError } = require('../utils/http');
const { clinicDate, shiftBounds, validateBookingDate } = require('../utils/clinicTime');
const { ACTIVE_STATUSES, activeFilter, withQueueTransaction, refreshQueue } = require('./queueService');

const assertObjectId = (id) => {
  if (typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) throw new HttpError(400, 'Invalid record identifier');
};

const assertTransition = (appointment, role, status, now = new Date()) => {
  const date = appointment.clinicDate || clinicDate(appointment.appointmentDate);
  if (!ACTIVE_STATUSES.includes(appointment.status)) throw new HttpError(409, 'This appointment is no longer awaiting a visit');
  if (date < clinicDate(now)) throw new HttpError(409, 'Past appointments cannot be changed');
  if (role === 'Patient' && ['Confirmed', 'CancelledByPatient'].includes(status) && !appointment.checkedIn && appointment.status !== 'CheckedIn') return;
  if (role === 'Admin' && status === 'CheckedIn' && date === clinicDate(now)) return;
  throw new HttpError(403, 'You cannot make this appointment status change');
};

const bookAppointment = async (userId, { doctorId, appointmentDate, symptoms = '' }, now = new Date()) => {
  assertObjectId(doctorId);
  const { start, end } = validateBookingDate(appointmentDate, now);
  return withQueueTransaction(doctorId, appointmentDate, async (session) => {
    const patient = await Patient.findOne({ userId }).session(session);
    if (!patient) throw new HttpError(404, 'Patient profile not found');
    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor) throw new HttpError(404, 'Doctor not found');
    const user = await User.findById(doctor.userId).session(session);
    if (!user || user.status !== 'Active') throw new HttpError(409, 'This doctor is unavailable');
    const leave = await DoctorLeave.exists({ doctorId, startDate: { $lt: end }, endDate: { $gte: start } }).session(session);
    if (leave) throw new HttpError(409, 'This doctor is on leave on the selected date');
    const duplicate = await Appointment.exists({ ...activeFilter(doctorId, appointmentDate), patientId: patient._id }).session(session);
    if (duplicate) throw new HttpError(409, 'You already have an active appointment with this doctor on that date');
    const shift = shiftBounds(doctor, appointmentDate);
    const count = await Appointment.countDocuments(activeFilter(doctorId, appointmentDate)).session(session);
    const duration = Math.max(5, Math.min(120, Number(doctor.avgConsultationTime) || 15));
    if (Math.max(now.getTime(), shift.start.getTime()) + (count + 1) * duration * 60000 > shift.end.getTime()) {
      throw new HttpError(409, 'This doctor has no remaining capacity on the selected date');
    }
    const [appointment] = await Appointment.create([{
      patientId: patient._id, doctorId, appointmentDate: start, clinicDate: appointmentDate,
      symptoms, activeBookingKey: `${patient._id}:${doctorId}:${appointmentDate}`,
      confirmationStatus: 'NoResponse', status: 'Pending', appointmentType: 'Normal',
    }], { session });
    await refreshQueue(doctor, appointmentDate, session, now);
    return Appointment.findById(appointment._id).session(session).lean();
  });
};

const changeStatus = async (user, appointmentId, status, now = new Date()) => {
  assertObjectId(appointmentId);
  // Look up ownership before acquiring the queue lock; re-read inside the transaction.
  const existing = await Appointment.findById(appointmentId).lean();
  if (!existing) throw new HttpError(404, 'Appointment not found');
  let patient;
  if (user.role === 'Patient') {
    patient = await Patient.findOne({ userId: user._id });
    if (!patient || String(existing.patientId) !== String(patient._id)) throw new HttpError(404, 'Appointment not found');
  }
  const date = existing.clinicDate || clinicDate(existing.appointmentDate);
  return withQueueTransaction(existing.doctorId, date, async (session) => {
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) throw new HttpError(404, 'Appointment not found');
    assertTransition(appointment, user.role, status, now);
    const update = { $set: { status } };
    if (status === 'Confirmed') update.$set.confirmationStatus = 'Confirmed';
    if (status === 'CheckedIn') update.$set.checkedIn = true;
    if (status === 'CancelledByPatient') {
      update.$set.confirmationStatus = 'Cancelled';
      update.$unset = { activeBookingKey: 1, queuePosition: 1, estimatedWindowStart: 1, estimatedWindowEnd: 1 };
    }
    await Appointment.updateOne({ _id: appointmentId }, update, { session, runValidators: true });
    const doctor = await Doctor.findById(appointment.doctorId).session(session);
    if (doctor) await refreshQueue(doctor, date, session, now);
    return Appointment.findById(appointmentId).session(session).lean();
  });
};

module.exports = { assertObjectId, assertTransition, bookAppointment, changeStatus };
