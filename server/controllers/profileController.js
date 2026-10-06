const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { HttpError, success } = require('../utils/http');

const modelFor = (role) => role === 'Patient' ? Patient : Doctor;

exports.getProfile = async (req, res) => {
  const query = modelFor(req.user.role).findOne({ userId: req.user._id })
    .populate('userId', 'name email phone role');
  if (req.user.role === 'Doctor') query.populate('departmentId', 'departmentName');
  const profile = await query.lean();
  if (!profile) throw new HttpError(404, 'Profile not found');
  success(res, { profile });
};

exports.updateProfile = async (req, res) => {
  const profile = await modelFor(req.user.role).findOneAndUpdate(
    { userId: req.user._id }, { $set: req.body }, { new: true, runValidators: true }
  );
  if (!profile) throw new HttpError(404, 'Profile not found');
  await exports.getProfile(req, res);
};

exports.listUsers = async (req, res) => {
  const page = Number(req.query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1) throw new HttpError(400, 'Invalid page');
  const filter = {};
  if (req.query.role) {
    if (!['Patient', 'Doctor', 'Admin'].includes(req.query.role)) throw new HttpError(400, 'Invalid role');
    filter.role = req.query.role;
  }
  if (req.query.search) {
    if (typeof req.query.search !== 'string' || req.query.search.length > 100) throw new HttpError(400, 'Invalid search');
    const search = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: search }, { email: search }];
  }
  const users = await User.find(filter).select('name email phone role status createdAt').sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25).lean();
  success(res, { users, page, total: await User.countDocuments(filter), pageSize: 25 });
};
