const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { admins, superAdmins, employees } = require('../data/mockData');

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

module.exports = { login };
