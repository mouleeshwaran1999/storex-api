const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ← REPLACED: Mock data with MongoDB User model

// ================================================================
// AUTHENTICATION CONTROLLER
// ================================================================
// LOGIN METHOD: Username OR Mobile + Password
// NO SIGNUP FLOW - Users are pre-created
// 
// JWT Payload includes:
// - userId: User's unique ID
// - role: super_admin | admin | employee
// - storeId: Only for employees (mandatory)
// ================================================================

const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/mobile and password are required' });
  }

  // Match by username (case-insensitive) OR mobile number across all roles
  const trimmed = String(identifier).trim();
  const user = await User.findOne({
    $or: [
      { username: trimmed.toLowerCase() },
      { mobile: trimmed }
    ]
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Employees must be assigned to a store before they can sign in
  if (user.role === 'employee' && !user.storeId) {
    return res.status(403).json({
      message: 'Employee must be assigned to a store. Please contact your administrator.',
    });
  }

  // Build JWT payload with userId, role, and storeId (for employees)
  const payload = {
    userId: user._id.toString(), // ← CHANGED: Use MongoDB _id
    role: user.role,
    ...(user.storeId && { storeId: user.storeId.toString() }), // ← CHANGED: Convert ObjectId to string
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return res.json({
    token,
    user: {
      id: user._id.toString(), // ← CHANGED: Use MongoDB _id
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      role: user.role,
      ...(user.storeId && { storeId: user.storeId.toString() }), // ← CHANGED: Convert ObjectId to string
    },
  });
};

// ================================================================
// CHANGE PASSWORD
// ================================================================
// Allows any authenticated user to change their password
// Requires current password verification
// Available for ALL roles: super_admin, admin, employee
// ================================================================

const changePassword = async (req, res) => {
  const { userId, role } = req.user; // From JWT token
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ message: 'New password must be at least 4 characters' });
  }

  // ← REPLACED: Mock array search with MongoDB query
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  // Update password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save(); // ← CHANGED: Save to MongoDB instead of in-memory update

  return res.json({ message: 'Password changed successfully' });
};

module.exports = { login, changePassword };
