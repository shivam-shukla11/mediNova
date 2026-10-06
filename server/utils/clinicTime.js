const { HttpError } = require('./http');
const DAY_MS = 86400000;
const OFFSET_MS = 330 * 60000;

const clinicDate = (now = new Date()) => new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);

const dayBounds = (date) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, 'Date must be in YYYY-MM-DD format');
  }
  const midnight = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, 'Date must be a valid calendar day');
  }
  const start = new Date(midnight.getTime() - OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
};

const shiftBounds = (doctor, date) => {
  const { start } = dayBounds(date);
  const minutes = (time) => {
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new HttpError(409, 'Doctor has an invalid shift; contact reception');
    }
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  const from = minutes(doctor.shiftStart);
  const to = minutes(doctor.shiftEnd);
  if (to <= from) throw new HttpError(409, 'Doctor has an invalid shift; contact reception');
  return { start: new Date(start.getTime() + from * 60000), end: new Date(start.getTime() + to * 60000) };
};

const validateBookingDate = (date, now = new Date()) => {
  const bounds = dayBounds(date);
  const today = dayBounds(clinicDate(now)).start;
  if (bounds.start < today || bounds.start.getTime() > today.getTime() + 30 * DAY_MS) {
    throw new HttpError(400, 'Choose a date from today through the next 30 days');
  }
  return bounds;
};

module.exports = { clinicDate, dayBounds, shiftBounds, validateBookingDate };
