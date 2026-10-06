const { test } = require('node:test');
const assert = require('node:assert/strict');
const { clinicDate, dayBounds, shiftBounds, validateBookingDate } = require('../utils/clinicTime');
const { queueWindows } = require('../services/queueService');
const { assertTransition } = require('../services/appointmentService');

test('clinic days use IST across UTC midnight, and reject impossible dates', () => {
  assert.equal(clinicDate(new Date('2026-10-07T19:00:00Z')), '2026-10-08');
  assert.equal(dayBounds('2026-10-08').start.toISOString(), '2026-10-07T18:30:00.000Z');
  assert.throws(() => dayBounds('2026-02-30'));
  assert.throws(() => dayBounds('2026-1-01'));
  assert.throws(() => validateBookingDate('2026-10-06', new Date('2026-10-07T04:00:00Z')));
  assert.throws(() => validateBookingDate('2026-11-07', new Date('2026-10-07T04:00:00Z')));
});

test('queues preserve booking order regardless of confirmation/no-show risk, with operational priorities only', () => {
  const doctor = { shiftStart: '09:00', shiftEnd: '17:00', avgConsultationTime: 15 };
  const now = new Date('2026-10-07T02:00:00Z');
  const entries = [
    { _id: 'a', appointmentType: 'Normal', createdAt: '2026-10-01', status: 'NoResponse', riskScore: 0.99 },
    { _id: 'b', appointmentType: 'Normal', createdAt: '2026-10-02', status: 'Confirmed', riskScore: 0 },
    { _id: 'c', appointmentType: 'Walkin', createdAt: '2026-09-30' },
    { _id: 'd', appointmentType: 'Emergency', createdAt: '2026-10-03' },
  ];
  const result = queueWindows(doctor, '2026-10-07', entries, now);
  assert.deepEqual(result.map((entry) => entry._id), ['d', 'a', 'b', 'c']);
  assert.deepEqual(result.map((entry) => entry.queuePosition), [1, 2, 3, 4]);
  assert.equal(result[0].estimatedWindowStart.toISOString(), '2026-10-07T03:30:00.000Z');
  assert.equal(result[1].estimatedWindowEnd.toISOString(), '2026-10-07T03:50:00.000Z');
});

test('expired shift configurations are rejected and live estimates advance with actual time', () => {
  assert.throws(() => shiftBounds({ shiftStart: '17:00', shiftEnd: '09:00' }, '2026-10-07'));
  assert.throws(() => shiftBounds({ shiftStart: '25:00', shiftEnd: '26:00' }, '2026-10-07'));
  const [entry] = queueWindows({ shiftStart: '09:00', shiftEnd: '17:00', avgConsultationTime: 15 }, '2026-10-07', [{ _id: 'a', createdAt: '2026-10-01' }], new Date('2026-10-07T05:00:00Z'));
  assert.equal(entry.estimatedWindowEnd.toISOString(), '2026-10-07T05:05:00.000Z');
});

test('status transitions enforce role, date and check-in restrictions', () => {
  const now = new Date('2026-10-07T05:00:00Z');
  const appointment = { clinicDate: '2026-10-07', status: 'Pending', checkedIn: false };
  assert.doesNotThrow(() => assertTransition(appointment, 'Patient', 'Confirmed', now));
  assert.doesNotThrow(() => assertTransition(appointment, 'Admin', 'CheckedIn', now));
  assert.throws(() => assertTransition(appointment, 'Patient', 'CheckedIn', now));
  assert.throws(() => assertTransition(appointment, 'Doctor', 'Completed', now));
  assert.throws(() => assertTransition({ ...appointment, checkedIn: true }, 'Patient', 'CancelledByPatient', now));
  assert.throws(() => assertTransition({ ...appointment, clinicDate: '2026-10-08' }, 'Admin', 'CheckedIn', now));
  assert.throws(() => assertTransition({ ...appointment, status: 'Completed' }, 'Patient', 'Confirmed', now));
});
