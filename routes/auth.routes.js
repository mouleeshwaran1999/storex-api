const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public route
router.post('/login', login);

// Protected route - requires authentication (available for all roles)
router.put('/change-password', authenticate, changePassword);

module.exports = router;
