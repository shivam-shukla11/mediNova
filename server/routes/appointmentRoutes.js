const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validators/authValidators');
const { asyncRoute } = require('../utils/http');
const controller = require('../controllers/appointmentController');
const router = express.Router();

router.use(protect);
router.get('/my', authorize('Patient'), asyncRoute(controller.myAppointments));
router.get('/doctor', authorize('Doctor'), asyncRoute(controller.doctorQueue));
router.get('/', authorize('Admin'), asyncRoute(controller.adminAppointments));
router.post('/', authorize('Patient'), [
  body('doctorId').isMongoId().withMessage('Choose a valid doctor'),
  body('appointmentDate').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Choose a valid appointment date'),
  body('symptoms').optional().isString().bail().trim().isLength({ max: 2000 }).withMessage('Symptoms must be at most 2000 characters'),
  body('patientId').not().exists().withMessage('Patient identity is taken from your account'),
  body('appointmentType').not().exists().withMessage('Reception registers emergency and walk-in visits'),
], handleValidationErrors, asyncRoute(controller.book));
router.patch('/:id/status', authorize('Patient', 'Admin'), [
  body('status').isIn(['Confirmed', 'CancelledByPatient', 'CheckedIn']).withMessage('Invalid appointment status'),
], handleValidationErrors, asyncRoute(controller.status));

module.exports = router;
