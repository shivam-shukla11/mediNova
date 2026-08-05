const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medinova.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';
const ADMIN_ID = process.env.ADMIN_ID || 'ADM_001';
const JWT_SECRET = process.env.JWT_SECRET || 'medinova_dev_jwt_secret';

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const generateToken = (user) => {
  if (!JWT_SECRET) {
    return null;
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const createUserResponse = (user, token, extra = {}) => ({
  success: true,
  message: 'Operation completed successfully',
  data: {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...extra,
    },
  },
});

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      dob,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      departmentId,
      specialization,
      qualification,
      experience,
      consultationFee,
      shiftStart,
      shiftEnd,
    } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, phone and role',
        data: null,
      });
    }

    if (!['Patient', 'Doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be Patient or Doctor',
        data: null,
      });
    }

    if (role === 'Patient' && (!dob || !gender)) {
      return res.status(400).json({
        success: false,
        message: 'Patient registration requires dob and gender',
        data: null,
      });
    }

    if (
      role === 'Doctor' &&
      (!departmentId || !specialization || !qualification || !consultationFee || !shiftStart || !shiftEnd)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Doctor registration requires departmentId, specialization, qualification, consultationFee, shiftStart and shiftEnd',
        data: null,
      });
    }

    let doctorId = null;
    let department = null;

    if (role === 'Doctor') {
      department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Invalid departmentId — department does not exist',
          data: null,
        });
      }

      const abbreviation = department.departmentName
        .slice(0, 3)
        .toLowerCase();
      const existingCount = await Doctor.countDocuments({ departmentId });
      const sequence = String(existingCount + 1).padStart(3, '0');
      doctorId = `${abbreviation}_${sequence}`;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with that email already exists',
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: sanitize(name),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone,
      status: 'Active',
    });

    try {
      if (role === 'Patient') {
        await Patient.create({
          userId: user._id,
          dob,
          gender,
          bloodGroup: sanitize(bloodGroup),
          address: sanitize(address),
          medicalHistory: sanitize(medicalHistory || ''),
        });
      }

      if (role === 'Doctor') {
        await Doctor.create({
          userId: user._id,
          doctorId,
          departmentId,
          specialization: sanitize(specialization),
          qualification: sanitize(qualification),
          experience: experience || 0,
          consultationFee,
          shiftStart,
          shiftEnd,
        });
      }
    } catch (linkedError) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create linked profile',
        data: null,
      });
    }

    const token = generateToken(user);
    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Operation completed successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: doctorId || undefined,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      data: null,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, doctorId, adminId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        data: null,
      });
    }

    if (adminId) {
      if (password !== ADMIN_PASSWORD || adminId !== ADMIN_ID || email.toLowerCase().trim() !== ADMIN_EMAIL) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials',
          data: null,
        });
      }

      let user = await User.findOne({ email: ADMIN_EMAIL });
      if (!user) {
        const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        user = await User.create({
          name: 'Admin',
          email: ADMIN_EMAIL,
          password: hashedAdminPassword,
          role: 'Admin',
          phone: '0000000000',
          status: 'Active',
        });
      }

      const token = generateToken(user);
      return res.status(200).json(createUserResponse(user, token));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    }

    if (user.role === 'Admin' && !adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin login requires adminId',
        data: null,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    }

    if (doctorId) {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor || doctor.doctorId !== doctorId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid doctor ID or credentials',
          data: null,
        });
      }
    }

    const token = generateToken(user);
    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        data: null,
      });
    }

    return res.status(200).json(createUserResponse(user, token));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      data: null,
    });
  }
};
