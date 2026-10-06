const express = require('express');
const { body } = require('express-validator');
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validators/authValidators');
const { asyncRoute } = require('../utils/http');

const router = express.Router();

// Registration needs to list departments before a user has an account.
router.get('/', asyncRoute(getDepartments));
router.post('/', protect, authorize('Admin'), [
  body('departmentName').isString().withMessage('Department name is required').bail()
    .trim().customSanitizer(value => value.replace(/\s+/g, ' '))
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  body('description').optional().isString().withMessage('Description must be text').bail()
    .trim().isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
], handleValidationErrors, asyncRoute(createDepartment));

module.exports = router;
