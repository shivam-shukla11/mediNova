const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const DoctorLeave = require('../models/DoctorLeave');
const Appointment = require('../models/Appointment');
const QueueState = require('../models/QueueState');
const Counter = require('../models/Counter');
const { generateToken } = require('../config/auth');
const { clinicDate, dayBounds } = require('../utils/clinicTime');
const { errorHandler } = require('../utils/http');

test('appointment API: isolated database, transactions, capacity, leave, privacy and role boundaries', {
  skip: process.env.RUN_DB_TESTS !== '1', timeout: 120000,
}, async (t) => {
  require('dotenv').config();
  const dbName = `medinova_test_${crypto.randomBytes(8).toString('hex')}`;
  if (!process.env.MONGO_URI) throw new Error('Configure MONGO_URI to run integration tests');
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 15000, autoCreate: false, autoIndex: false });
  let server;
  let ownsDatabase = false;
  try {
    // Never modify or drop the configured application database.
    assert.equal(mongoose.connection.name, dbName);
    assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
    ownsDatabase = true;
    for (const model of [User, Patient, Doctor, Department, Appointment, QueueState, DoctorLeave, Counter]) {
      await model.createCollection();
      await model.createIndexes();
    }
    const department = await Department.create({ departmentName: 'Test Medicine' });
    const makeUser = async (role, suffix) => User.create({ name: `Test ${suffix}`, email: `${suffix}@example.test`, phone: '9876543210', password: 'unused-test-hash', role, status: 'Active' });
    const doctorUser = await makeUser('Doctor', 'doctor');
    const admin = await makeUser('Admin', 'admin');
    const patients = [];
    for (let index = 0; index < 8; index++) {
      const user = await makeUser('Patient', `patient${index}`);
      const profile = await Patient.create({ userId: user._id, dob: new Date('2000-01-01'), gender: 'Other' });
      patients.push({ user, profile });
    }
    const doctor = await Doctor.create({ userId: doctorUser._id, doctorId: 'tst_001', departmentId: department._id, specialization: 'Medicine', qualification: 'MBBS', consultationFee: 500, shiftStart: '09:00', shiftEnd: '17:00' });
    const app = express();
    app.use(express.json());
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/departments', require('../routes/departmentRoutes'));
    app.use('/api/appointments', require('../routes/appointmentRoutes'));
    const profiles = require('../routes/profileRoutes');
    app.use('/api/patients', profiles.patients);
    app.use('/api/doctors', profiles.doctors);
    app.use('/api/doctors', profiles.discovery);
    app.use('/api/admin', profiles.admin);
    app.use(errorHandler);
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
      listener.once('error', reject);
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = async (user, path, method = 'GET', body) => {
      const headers = { 'Content-Type': 'application/json' };
      if (user) headers.Authorization = `Bearer ${generateToken(user)}`;
      const response = await fetch(`${base}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    };
    const day = clinicDate(new Date(Date.now() + 86400000));
    const payload = { doctorId: String(doctor._id), appointmentDate: day, symptoms: 'Test visit' };

    let createdDepartment;
    await t.test('only admins create departments, with validation and duplicate race protection', async () => {
      for (const [user, status] of [[null, 401], [patients[0].user, 403], [doctorUser, 403]]) {
        assert.equal((await request(user, '/api/departments', 'POST', { departmentName: 'Psychiatry' })).status, status);
      }
      const invalid = await request(admin, '/api/departments', 'POST', { departmentName: '  ' });
      assert.equal(invalid.status, 400);
      assert.equal((await request(admin, '/api/departments', 'POST', { departmentName: 'Psychiatry', description: 42 })).status, 400);
      const results = await Promise.all(['  Psychiatry  ', 'PSYCHIATRY'].map(departmentName =>
        request(admin, '/api/departments', 'POST', { departmentName, description: 'Mental health care' })));
      assert.equal(results.filter(result => result.status === 201).length, 1);
      assert.equal(results.filter(result => result.status === 409).length, 1);
      createdDepartment = results.find(result => result.status === 201).body.data.department;
      const list = await request(null, '/api/departments');
      assert.equal(list.status, 200);
      assert.ok(list.body.data.departments.some(entry => entry._id === createdDepartment._id));
      assert.equal(list.body.data.departments.length, 2);
      // The case-insensitive check also protects legacy rows without normalizedName.
      assert.equal((await request(admin, '/api/departments', 'POST', { departmentName: 'test medicine' })).status, 409);
    });

    await t.test('doctor registration creates a usable profile with a formatted phone and permits login', async () => {
      const registration = {
        name: 'Registered Doctor', email: 'registered-doctor@example.test', password: 'Test-password-123',
        phone: '+91 98765 43210', role: 'Doctor', departmentId: createdDepartment._id,
        specialization: 'Medicine', qualification: 'MBBS', consultationFee: 500,
        shiftStart: '10:00', shiftEnd: '16:00',
      };
      const invalid = await request(null, '/api/auth/register', 'POST', { ...registration, shiftEnd: '01:00' });
      assert.equal(invalid.status, 400);
      assert.ok(invalid.body.errors.some(error => error.field === 'shiftEnd'));
      assert.equal(await User.countDocuments({ email: registration.email }), 0);
      const created = await request(null, '/api/auth/register', 'POST', registration);
      assert.equal(created.status, 201, created.body.message);
      assert.ok(created.body.data.token);
      const registered = await User.findOne({ email: registration.email });
      assert.equal(registered.phone, '+919876543210');
      const profile = await Doctor.findOne({ userId: registered._id });
      assert.equal(String(profile.departmentId), createdDepartment._id);
      assert.equal(profile.shiftStart, '10:00');
      assert.equal(profile.shiftEnd, '16:00');
      const loggedIn = await request(null, '/api/auth/login', 'POST', {
        email: registration.email, password: registration.password, doctorId: profile.doctorId,
      });
      assert.equal(loggedIn.status, 200);
      assert.equal(loggedIn.body.data.user.role, 'Doctor');
      const doctors = await request(patients[0].user, `/api/doctors?date=${clinicDate(new Date(Date.now() + 86400000))}&departmentId=${createdDepartment._id}`);
      assert.equal(doctors.status, 200);
      assert.equal(doctors.body.data.doctors.length, 1);
      assert.equal(doctors.body.data.doctors[0]._id, String(profile._id));
      assert.equal(doctors.body.data.doctors[0].departmentId.departmentName, createdDepartment.departmentName);
      assert.equal(doctors.body.data.doctors[0].availability.available, true);
      // Keep later discovery assertions scoped to the queue fixture.
      await User.updateOne({ _id: registered._id }, { status: 'Inactive' });
    });

    await t.test('unauthenticated and wrong-role requests are rejected', async () => {
      assert.equal((await request(null, '/api/doctors')).status, 401);
      assert.equal((await request(patients[0].user, '/api/admin/users')).status, 403);
      assert.equal((await request(doctorUser, '/api/appointments', 'POST', payload)).status, 403);
      assert.equal((await request(patients[0].user, '/api/doctors/me')).status, 403);
    });

    let first;
    await t.test('concurrent duplicate bookings create exactly one visit', async () => {
      const results = await Promise.all(Array.from({ length: 3 }, () => request(patients[0].user, '/api/appointments', 'POST', payload)));
      assert.equal(results.filter((result) => result.status === 201).length, 1);
      assert.equal(results.filter((result) => result.status === 409).length, 2);
      first = results.find((result) => result.status === 201).body.data.appointment;
      assert.equal(first.queuePosition, 1);
      assert.equal(await Appointment.countDocuments(), 1);
    });

    await t.test('simultaneous different patients get unique queue positions', async () => {
      const results = await Promise.all(patients.slice(1, 5).map(({ user }) => request(user, '/api/appointments', 'POST', payload)));
      assert.ok(results.every((result) => result.status === 201), JSON.stringify(results.map((result) => ({ status: result.status, message: result.body.message }))));
      const stored = await Appointment.find({ clinicDate: day });
      assert.deepEqual(stored.map((entry) => entry.queuePosition).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
    });

    await t.test('patient scope, confirmation, cancellation and queue recalculation', async () => {
      const mine = await request(patients[1].user, '/api/appointments/my');
      assert.equal(mine.body.data.appointments.length, 1);
      assert.equal(mine.body.data.appointments[0].patientId._id, String(patients[1].profile._id));
      assert.equal((await request(patients[1].user, `/api/appointments/${first._id}/status`, 'PATCH', { status: 'CancelledByPatient' })).status, 404);
      assert.equal((await request(patients[0].user, `/api/appointments/${first._id}/status`, 'PATCH', { status: 'Confirmed' })).status, 200);
      assert.equal((await request(admin, `/api/appointments/${first._id}/status`, 'PATCH', { status: 'CheckedIn' })).status, 403);
      assert.equal((await request(patients[0].user, `/api/appointments/${first._id}/status`, 'PATCH', { status: 'CancelledByPatient' })).status, 200);
      const remaining = await Appointment.find({ status: { $in: ['Pending', 'Confirmed'] } });
      assert.deepEqual(remaining.map((entry) => entry.queuePosition).sort((a, b) => a - b), [1, 2, 3, 4]);
      assert.equal((await request(patients[0].user, '/api/appointments', 'POST', payload)).status, 201);
    });

    await t.test('profile updates whitelist editable fields and never expose password hashes', async () => {
      const saved = await request(patients[0].user, '/api/patients/me', 'PATCH', { address: 'Test address', medicalHistory: 'Test history' });
      assert.equal(saved.status, 200);
      assert.equal(saved.body.data.profile.address, 'Test address');
      assert.equal(saved.body.data.profile.userId.password, undefined);
      assert.equal((await request(patients[0].user, '/api/patients/me', 'PATCH', { userId: String(patients[1].user._id), role: 'Admin' })).status, 400);
      const directory = await request(admin, '/api/admin/users');
      assert.equal(directory.status, 200);
      assert.ok(directory.body.data.users.every((user) => !Object.hasOwn(user, 'password')));
      assert.equal((await request(doctorUser, '/api/doctors/me')).body.data.profile._id, String(doctor._id));
    });

    await t.test('leave and malformed dates are rejected through the actual API', async () => {
      const leaveDay = clinicDate(new Date(Date.now() + 2 * 86400000));
      const bounds = dayBounds(leaveDay);
      await DoctorLeave.create({ doctorId: doctor._id, startDate: bounds.start, endDate: bounds.start });
      assert.equal((await request(patients[5].user, '/api/appointments', 'POST', { ...payload, appointmentDate: leaveDay })).status, 409);
      assert.equal((await request(patients[5].user, '/api/appointments', 'POST', { ...payload, appointmentDate: '2026-02-30' })).status, 400);
      const discovery = await request(patients[5].user, `/api/doctors?date=${leaveDay}`);
      assert.equal(discovery.body.data.doctors[0].availability.available, false);
    });

    await t.test('capacity remains bounded under racing bookings', async () => {
      await Doctor.updateOne({ _id: doctor._id }, { shiftEnd: '09:15' });
      const capacityDay = clinicDate(new Date(Date.now() + 3 * 86400000));
      const results = await Promise.all(patients.slice(5, 8).map(({ user }) => request(user, '/api/appointments', 'POST', { ...payload, appointmentDate: capacityDay })));
      assert.equal(results.filter((result) => result.status === 201).length, 1);
      assert.equal(results.filter((result) => result.status === 409).length, 2);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (ownsDatabase) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
