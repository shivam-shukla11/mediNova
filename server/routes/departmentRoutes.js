const express = require('express');
const { getDepartments } = require('../controllers/departmentController');

const router = express.Router();

router.get('/', getDepartments);

module.exports = router;
