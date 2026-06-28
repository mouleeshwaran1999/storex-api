const express = require('express');
const router = express.Router();
const { login, changePassword, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');
const User = require('../models/User');

// Public route
router.post('/login', login);

// Temporary debug route — remove after fixing production
router.get('/debug', async (req, res) => {
  const result = {
    mongoState: mongoose.connection.readyState, // 1 = connected
    jwtSecret: !!process.env.JWT_SECRET,
    mongoUri: !!process.env.MONGO_URI,
  };
  try {
    const count = await User.countDocuments();
    result.userCount = count;
    result.dbQuery = 'ok';
  } catch (e) {
    result.dbQuery = e.message;
  }
  res.json(result);
});

// Protected routes — available for all roles
router.put('/change-password', authenticate, changePassword);
router.put('/profile',         authenticate, updateProfile);

module.exports = router;
