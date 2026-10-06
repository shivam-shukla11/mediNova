const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validators/authValidators');
const { HttpError, asyncRoute } = require('../utils/http');
const controller = require('../controllers/profileController');

const profileRouter = (role) => {
  const router = express.Router();
  const fields = role === 'Patient' ? ['address', 'medicalHistory', 'bloodGroup'] : ['specialization', 'qualification', 'experience'];
  router.get('/me', protect, authorize(role), asyncRoute(controller.getProfile));
  router.patch('/me', protect, authorize(role), (req, res, next) => {
    if (!req.body || Array.isArray(req.body) || !Object.keys(req.body).length || Object.keys(req.body).some((field) => !fields.includes(field))) {
      return next(new HttpError(400, 'Only editable profile fields may be updated'));
    }
    next();
  }, [
    ...fields.filter((field) => field !== 'experience' && field !== 'bloodGroup').map((field) =>
      body(field).optional().isString().bail().trim().isLength({ max: field === 'medicalHistory' ? 4000 : 300, min: role === 'Doctor' ? 2 : 0 })
    ),
    body('bloodGroup').optional().isIn(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('experience').optional().isFloat({ min: 0, max: 80 }),
  ], handleValidationErrors, asyncRoute(controller.updateProfile));
  return router;
};

const doctors = profileRouter('Doctor');
const doctorController = require('../controllers/doctorController');
// Discovery is role-neutral but still authenticated; mount separately from /me.
const discovery = express.Router();
discovery.use(protect);
discovery.get('/', asyncRoute(doctorController.listDoctors));
discovery.get('/:id', asyncRoute(doctorController.getDoctor));
const admin = express.Router();
admin.use(protect, authorize('Admin'));
admin.get('/users', asyncRoute(controller.listUsers));

module.exports = { patients: profileRouter('Patient'), doctors, discovery, admin };
