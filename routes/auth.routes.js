const express = require('express');
const router = express.Router();
const { login, changePassword, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public route
router.post('/login', login);

// Protected routes — available for all roles
router.put('/change-password', authenticate, changePassword);
router.put('/profile',         authenticate, updateProfile);

module.exports = router;
