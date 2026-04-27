const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { admins, superAdmins, employees } = require('../data/mockData');

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

  // Match by username OR mobile number across all roles
  const allUsers = [...superAdmins, ...admins, ...employees];
  const user = allUsers.find(
    (u) => u.username === identifier || u.mobile === identifier
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Build JWT payload with userId, role, and storeId (for employees)
  const payload = {
    userId: user.id,
    role: user.role,
    ...(user.storeId && { storeId: user.storeId }),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      role: user.role,
      ...(user.storeId && { storeId: user.storeId }),
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

  // Find user in appropriate array based on role
  let userArray;
  if (role === 'super_admin') {
    userArray = superAdmins;
  } else if (role === 'admin') {
    userArray = admins;
  } else if (role === 'employee') {
    userArray = employees;
  } else {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = userArray.find((u) => u.id === userId);
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

  return res.json({ message: 'Password changed successfully' });
};

module.exports = { login, changePassword };
