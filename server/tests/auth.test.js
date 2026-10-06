const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Counter = require('../models/Counter');
const { generateToken, verifyToken } = require('../config/auth');
const { protect } = require('../middleware/authMiddleware');
const { nextDoctorId } = require('../services/doctorIdService');
const { registerValidation, handleValidationErrors } = require('../middleware/validators/authValidators');

process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'Test-admin-password-123';
process.env.ADMIN_ID = 'TEST_ADMIN';
const { loginUser } = require('../controllers/authController');
const originalSecret = process.env.JWT_SECRET;
afterEach(() => {
  mock.restoreAll();
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('JWT configuration fails closed instead of using a default secret', () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => generateToken({ _id: 'user', role: 'Patient' }), /JWT_SECRET/);
});

test('tokens use the same secret for signing and verification, and expire in seven days', () => {
  process.env.JWT_SECRET = 'test-secret-for-medinova';
  const decoded = verifyToken(generateToken({ _id: 'user', role: 'Patient' }));
  assert.equal(decoded.id, 'user');
  assert.equal(decoded.exp - decoded.iat, 7 * 24 * 60 * 60);
  assert.throws(() => verifyToken(jwt.sign({ id: 'user' }, 'another-secret')));
});

test('protected routes reject missing and expired tokens', async () => {
  process.env.JWT_SECRET = 'test-secret-for-medinova';
  for (const authorization of [undefined, `Bearer ${jwt.sign({ id: 'user' }, process.env.JWT_SECRET, { expiresIn: -1 })}`]) {
    const res = response();
    await protect({ headers: { authorization } }, res, () => assert.fail('Access granted'));
    assert.equal(res.statusCode, 401);
  }
});

test('protected routes reject inactive accounts even with a valid token', async () => {
  process.env.JWT_SECRET = 'test-secret-for-medinova';
  mock.method(User, 'findById', () => ({ select: async () => ({ status: 'Inactive' }) }));
  const res = response();
  await protect({ headers: { authorization: `Bearer ${generateToken({ _id: 'user', role: 'Patient' })}` } }, res, () => assert.fail('Access granted'));
  assert.equal(res.statusCode, 403);
});

test('inactive accounts cannot log in', async () => {
  mock.method(User, 'findOne', async () => ({ status: 'Inactive', role: 'Patient' }));
  const res = response();
  await loginUser({ body: { email: 'patient@example.com', password: 'password' } }, res);
  assert.equal(res.statusCode, 403);
});

test('configured admin credentials cannot authenticate an existing patient as admin', async () => {
  mock.method(User, 'findOne', async () => ({ status: 'Active', role: 'Patient' }));
  const res = response();
  await loginUser({ body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, adminId: process.env.ADMIN_ID } }, res);
  assert.equal(res.statusCode, 403);
});

test('validation responses expose the field name with express-validator v7', async () => {
  const req = { body: {} };
  await Promise.all(registerValidation.map((validator) => validator.run(req)));
  const res = response();
  handleValidationErrors(req, res, () => assert.fail('Invalid registration accepted'));
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.errors.some((error) => error.field === 'email'));
});

test('doctor IDs remain unique across concurrent registrations and shared department prefixes', async () => {
  let sequence = 0;
  mock.method(Doctor, 'find', () => ({ select: () => ({ lean: async () => [{ doctorId: 'car_010' }] }) }));
  mock.method(Counter, 'updateOne', async (filter, update) => { sequence = Math.max(sequence, update.$max.value); });
  mock.method(Counter, 'findOneAndUpdate', async () => ({ value: ++sequence }));
  const ids = await Promise.all(Array.from({ length: 20 }, (_, index) => nextDoctorId(index % 2 ? 'Cardiology' : 'Cardiac Surgery')));
  assert.equal(new Set(ids).size, 20);
  assert.ok(ids.includes('car_011'));
  assert.ok(ids.includes('car_030'));
});

test('doctor counter initialization recovers from a duplicate-key race', async () => {
  mock.method(Doctor, 'find', () => ({ select: () => ({ lean: async () => [] }) }));
  let calls = 0;
  mock.method(Counter, 'updateOne', async () => { if (++calls === 1) throw Object.assign(new Error('Duplicate'), { code: 11000 }); });
  mock.method(Counter, 'findOneAndUpdate', async () => ({ value: 2 }));
  assert.equal(await nextDoctorId('Neurology'), 'neu_002');
  assert.equal(calls, 2);
});

const validDoctor = {
  name: 'Test Doctor', email: 'doctor@example.test', password: 'Test-password-123',
  phone: '+91 98765 43210', role: 'Doctor', departmentId: '507f1f77bcf86cd799439011',
  specialization: 'Medicine', qualification: 'MBBS', consultationFee: 500,
  shiftStart: '09:00', shiftEnd: '17:00',
};
const validateRegistration = async (body) => {
  const req = { body: { ...body } };
  for (const validator of registerValidation) await validator.run(req);
  const res = response();
  let accepted = false;
  handleValidationErrors(req, res, () => { accepted = true; });
  return { req, res, accepted };
};

test('doctor registration accepts the displayed phone format and normalizes it', async () => {
  const result = await validateRegistration(validDoctor);
  assert.equal(result.accepted, true);
  assert.equal(result.req.body.phone, '+919876543210');
});

test('doctor validation identifies invalid fields and rejects unusable shifts', async () => {
  for (const [field, value] of [
    ['phone', '+91 123'], ['password', 'onlyletters'], ['departmentId', 123],
    ['specialization', '   '], ['qualification', '   '],
    ['consultationFee', 0], ['consultationFee', '500junk'],
    ['shiftStart', '9'], ['shiftEnd', '01:00'], ['shiftEnd', '09:00'],
  ]) {
    const result = await validateRegistration({ ...validDoctor, [field]: value });
    assert.equal(result.accepted, false, field);
    assert.ok(result.res.body.errors.some(error => error.field === field), field);
    assert.ok(result.res.body.errors.every(error => !Object.hasOwn(error, 'value')));
  }
});
