const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { clinicDate, dayBounds } = require('../utils/clinicTime');
const { HttpError, success } = require('../utils/http');
const { bookAppointment, changeStatus } = require('../services/appointmentService');
const { ACTIVE_STATUSES, queueWindows, activeFilter } = require('../services/queueService');

const populated = (query) => query
  .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId', select: 'departmentName' }] })
  .populate({ path: 'patientId', select: 'userId', populate: { path: 'userId', select: 'name phone' } });

const liveWindows = (appointments) => {
  const groups = new Map();
  const now = new Date();
  for (const appointment of appointments) {
    const date = appointment.clinicDate || clinicDate(appointment.appointmentDate);
    if (!appointment.doctorId || !ACTIVE_STATUSES.includes(appointment.status) || date < clinicDate(now)) continue;
    const key = `${appointment.doctorId._id}:${date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(appointment);
  }
  // Full doctor/admin daily lists can be estimated together. Patient lists retain
  // persisted positions because they do not contain other patients' appointments.
  const updated = new Map();
  for (const group of groups.values()) {
    for (const entry of queueWindows(group[0].doctorId, group[0].clinicDate || clinicDate(group[0].appointmentDate), group, now)) {
      updated.set(String(entry._id), entry);
    }
  }
  return appointments.map((entry) => updated.get(String(entry._id)) || entry);
};

exports.book = async (req, res) => {
  const result = await bookAppointment(req.user._id, req.body);
  const appointment = await populated(Appointment.findById(result._id)).lean();
  success(res, { appointment }, 'Appointment booked', 201);
};

exports.myAppointments = async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new HttpError(404, 'Patient profile not found');
  const page = Number(req.query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1) throw new HttpError(400, 'Invalid page');
  const filter = { patientId: patient._id };
  const upcoming = req.query.upcoming === 'true';
  if (upcoming) {
    filter.status = { $in: ACTIVE_STATUSES };
    filter.appointmentDate = { $gte: dayBounds(clinicDate()).start };
  }
  const appointments = await populated(Appointment.find(filter)).sort({ appointmentDate: upcoming ? 1 : -1, createdAt: 1 }).skip((page - 1) * 25).limit(25).lean();
  const queues = new Map();
  for (const appointment of appointments) {
    const date = appointment.clinicDate || clinicDate(appointment.appointmentDate);
    if (!appointment.doctorId || !ACTIVE_STATUSES.includes(appointment.status) || date < clinicDate()) continue;
    const key = `${appointment.doctorId._id}:${date}`;
    if (!queues.has(key)) {
      const waiting = await Appointment.find(activeFilter(appointment.doctorId._id, date)).lean();
      queues.set(key, queueWindows(appointment.doctorId, date, waiting));
    }
    const entry = queues.get(key).find((item) => String(item._id) === String(appointment._id));
    if (entry) {
      appointment.queuePosition = entry.queuePosition;
      appointment.estimatedWindowStart = entry.estimatedWindowStart;
      appointment.estimatedWindowEnd = entry.estimatedWindowEnd;
    }
  }
  success(res, { appointments, page, total: await Appointment.countDocuments(filter), pageSize: 25 });
};

exports.doctorQueue = async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) throw new HttpError(404, 'Doctor profile not found');
  const date = req.query.date || clinicDate();
  const { start, end } = dayBounds(date);
  const appointments = await populated(Appointment.find({ doctorId: doctor._id, appointmentDate: { $gte: start, $lt: end } })).sort({ createdAt: 1 }).lean();
  success(res, { appointments: liveWindows(appointments), date, updatedAt: new Date() });
};

exports.adminAppointments = async (req, res) => {
  const date = req.query.date || clinicDate();
  const { start, end } = dayBounds(date);
  // Per-day clinic console: no medical-history fields or account passwords.
  const appointments = await populated(Appointment.find({ appointmentDate: { $gte: start, $lt: end } })).sort({ createdAt: 1 }).lean();
  success(res, { appointments: liveWindows(appointments), date, updatedAt: new Date() });
};

exports.status = async (req, res) => {
  const result = await changeStatus(req.user, req.params.id, req.body.status);
  const appointment = await populated(Appointment.findById(result._id)).lean();
  success(res, { appointment }, 'Appointment updated');
};
