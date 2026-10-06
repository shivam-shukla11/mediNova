const Doctor = require('../models/Doctor');
const DoctorLeave = require('../models/DoctorLeave');
const Appointment = require('../models/Appointment');
const { clinicDate, dayBounds, shiftBounds, validateBookingDate } = require('../utils/clinicTime');
const { activeFilter, queueWindows } = require('../services/queueService');
const { assertObjectId } = require('../services/appointmentService');
const { HttpError, success } = require('../utils/http');

const doctorAvailability = async (doctor, date) => {
  const now = new Date();
  const { start, end } = dayBounds(date);
  const booked = await Appointment.find(activeFilter(doctor._id, date)).select('appointmentType createdAt').lean();
  const onLeave = Boolean(await DoctorLeave.exists({ doctorId: doctor._id, startDate: { $lt: end }, endDate: { $gte: start } }));
  let reason = onLeave ? 'On leave' : null;
  let capacity = 0;
  let remaining = 0;
  let nextWindow = null;
  try {
    const shift = shiftBounds(doctor, date);
    const duration = Math.max(5, Math.min(120, Number(doctor.avgConsultationTime) || 15));
    capacity = Math.max(0, Math.floor((shift.end - Math.max(now.getTime(), shift.start.getTime())) / (duration * 60000)));
    remaining = Math.max(0, capacity - booked.length);
    if (!reason && !remaining) reason = 'No remaining capacity';
    if (!reason) {
      const placeholder = { _id: 'next', appointmentType: 'Normal', createdAt: now };
      const next = queueWindows(doctor, date, [...booked, placeholder], now).find((entry) => entry._id === 'next');
      nextWindow = { start: next.estimatedWindowStart, end: next.estimatedWindowEnd };
    }
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    reason = 'Schedule unavailable';
  }
  return { ...doctor, availability: { date, available: !reason, reason, onLeave, bookedCount: booked.length, capacity, remaining, nextWindow } };
};

exports.listDoctors = async (req, res) => {
  const date = req.query.date || clinicDate();
  validateBookingDate(date);
  const filter = {};
  if (req.query.departmentId) {
    assertObjectId(req.query.departmentId);
    filter.departmentId = req.query.departmentId;
  }
  const doctors = await Doctor.find(filter)
    .populate('userId', 'name status')
    .populate('departmentId', 'departmentName')
    .sort({ doctorId: 1 }).limit(100).lean();
  const availableDoctors = [];
  for (const doctor of doctors) {
    if (doctor.userId?.status === 'Active') availableDoctors.push(await doctorAvailability(doctor, date));
  }
  success(res, { doctors: availableDoctors, date });
};

exports.getDoctor = async (req, res) => {
  assertObjectId(req.params.id);
  const date = req.query.date || clinicDate();
  validateBookingDate(date);
  const doctor = await Doctor.findById(req.params.id).populate('userId', 'name status').populate('departmentId', 'departmentName').lean();
  if (!doctor || doctor.userId?.status !== 'Active') throw new HttpError(404, 'Doctor not found');
  success(res, { doctor: await doctorAvailability(doctor, date) });
};

exports.doctorAvailability = doctorAvailability;
