const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validators/authValidators');

const router = express.Router();

router.post('/register', registerValidation, handleValidationErrors, registerUser);
router.post('/login', loginValidation, handleValidationErrors, loginUser);
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated user fetched',
    data: { user: req.user },
  });
});

module.exports = router;
