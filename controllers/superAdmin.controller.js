const bcrypt = require('bcryptjs');
const { admins, generateId } = require('../data/mockData');

const getAdmins = (req, res) => {
  const safeAdmins = admins.map(({ passwordHash, ...rest }) => rest);
  res.json(safeAdmins);
};

const createAdmin = async (req, res) => {
  const { name, username, mobile, password } = req.body;

  if (!name || !username || !mobile || !password) {
    return res.status(400).json({ message: 'Name, username, mobile and password are required' });
  }

  const exists = admins.find((a) => a.username === username || a.mobile === mobile);
  if (exists) {
    return res.status(409).json({ message: 'Admin with this username or mobile already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newAdmin = {
    id: generateId('admin'),
    name,
    username,
    mobile,
    passwordHash,
    role: 'admin',
  };

  admins.push(newAdmin);
  const { passwordHash: _, ...safe } = newAdmin;
  res.status(201).json(safe);
};

const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, username, mobile, password } = req.body;

  const adminId = Number(id);
  const idx = admins.findIndex((a) => a.id === adminId);
  if (idx === -1) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  if (name) admins[idx].name = name;
  if (username) admins[idx].username = username;
  if (mobile) admins[idx].mobile = mobile;
  if (password) admins[idx].passwordHash = await bcrypt.hash(password, 10);

  const { passwordHash, ...safe } = admins[idx];
  res.json(safe);
};

const deleteAdmin = (req, res) => {
  const { id } = req.params;
  const adminId = Number(id);
  const idx = admins.findIndex((a) => a.id === adminId);

  if (idx === -1) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  admins.splice(idx, 1);
  res.json({ message: 'Admin deleted successfully' });
};

module.exports = { getAdmins, createAdmin, updateAdmin, deleteAdmin };
