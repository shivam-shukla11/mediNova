const { body, validationResult } = require('express-validator');

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one letter and one number'),
  body('phone')
    .trim()
    .customSanitizer(value => typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value)
    .matches(/^(\+91)?[0-9]{10}$/)
    .withMessage('Phone must be 10 digits, optionally prefixed with +91'),
  body('role')
    .isIn(['Patient', 'Doctor'])
    .withMessage('Role must be Patient or Doctor'),
  body('dob')
    .custom((value, { req }) => {
      if (req.body.role === 'Patient' && !value) {
        throw new Error('Date of birth is required for Patient');
      }
      if (req.body.role === 'Patient' && value && isNaN(Date.parse(value))) {
        throw new Error('Date of birth must be a valid date');
      }
      return true;
    }),
  body('gender')
    .custom((value, { req }) => {
      if (req.body.role === 'Patient' && !value) {
        throw new Error('Gender is required for Patient');
      }
      if (req.body.role === 'Patient' && value && !['Male', 'Female', 'Other'].includes(value)) {
        throw new Error('Gender must be Male, Female, or Other');
      }
      return true;
    }),
  body('departmentId')
    .custom((value, { req }) => {
      if (req.body.role === 'Doctor' && !value) {
        throw new Error('Department ID is required for Doctor');
      }
      if (req.body.role === 'Doctor' && value && (typeof value !== 'string' || !/^[0-9a-fA-F]{24}$/.test(value))) {
        throw new Error('Department ID must be a valid MongoDB ID');
      }
      return true;
    }),
  body('specialization')
    .trim()
    .custom((value, { req }) => {
      if (req.body.role === 'Doctor' && !value) throw new Error('Specialization is required');
      return true;
    }),
  body('qualification')
    .trim()
    .custom((value, { req }) => {
      if (req.body.role === 'Doctor' && !value) throw new Error('Qualification is required');
      return true;
    }),
  body('consultationFee')
    .custom((value, { req }) => {
      if (req.body.role === 'Doctor' &&
          (!['number', 'string'].includes(typeof value) || !Number.isFinite(Number(value)) || Number(value) <= 0)) {
        throw new Error('Consultation fee must be a positive number');
      }
      return true;
    }),
  body('shiftStart')
    .trim()
    .custom((value, { req }) => {
      if (req.body.role === 'Doctor' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        throw new Error('Shift start is required in 24-hour HH:MM format');
      }
      return true;
    }),
  body('shiftEnd')
    .trim()
    .custom((value, { req }) => {
      if (req.body.role !== 'Doctor') return true;
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        throw new Error('Shift end is required in 24-hour HH:MM format');
      }
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(req.body.shiftStart) && value <= req.body.shiftStart) {
        throw new Error('Shift end must be later than shift start on the same day');
      }
      return true;
    }),
];

exports.loginValidation = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
