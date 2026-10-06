const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const QueueState = require('../models/QueueState');
const { dayBounds, shiftBounds } = require('../utils/clinicTime');

const ACTIVE_STATUSES = ['Pending', 'Confirmed', 'NoResponse', 'CheckedIn'];
const activeFilter = (doctorId, date) => {
  const { start, end } = dayBounds(date);
  return { doctorId, appointmentDate: { $gte: start, $lt: end }, status: { $in: ACTIVE_STATUSES } };
};

const queueWindows = (doctor, date, appointments, now = new Date()) => {
  const shift = shiftBounds(doctor, date);
  const duration = Math.max(5, Math.min(120, Number(doctor.avgConsultationTime) || 15));
  const tolerance = 5 * 60000;
  const priority = { Emergency: 0, Normal: 1, Walkin: 2 };
  const sorted = [...appointments].sort((a, b) =>
    (priority[a.appointmentType] ?? 1) - (priority[b.appointmentType] ?? 1) ||
    new Date(a.createdAt) - new Date(b.createdAt) || String(a._id).localeCompare(String(b._id))
  );
  const anchor = Math.max(shift.start.getTime(), now.getTime());
  return sorted.map((appointment, index) => {
    const predicted = anchor + index * duration * 60000;
    return {
      ...appointment,
      queuePosition: index + 1,
      estimatedWindowStart: new Date(Math.max(shift.start.getTime(), predicted - tolerance)),
      estimatedWindowEnd: new Date(predicted + tolerance),
    };
  });
};

const withQueueTransaction = async (doctorId, date, work) => {
  const key = `${doctorId}:${date}`;
  try {
    await QueueState.updateOne({ _id: key }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return mongoose.connection.transaction(async (session) => {
    await QueueState.updateOne({ _id: key }, { $inc: { revision: 1 } }, { session });
    return work(session);
  });
};

const refreshQueue = async (doctor, date, session, now = new Date()) => {
  const appointments = await Appointment.find(activeFilter(doctor._id, date)).session(session).lean();
  const queue = queueWindows(doctor, date, appointments, now);
  if (queue.length) {
    await Appointment.bulkWrite(queue.map((entry) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: {
          queuePosition: entry.queuePosition,
          estimatedWindowStart: entry.estimatedWindowStart,
          estimatedWindowEnd: entry.estimatedWindowEnd,
        } },
      },
    })), { session });
  }
  return queue;
};

module.exports = { ACTIVE_STATUSES, activeFilter, queueWindows, withQueueTransaction, refreshQueue };
