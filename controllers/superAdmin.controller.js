const bcrypt = require('bcryptjs');
const User = require('../models/User'); // ← REPLACED: Mock data with MongoDB User model

const getAdmins = async (req, res) => {
  const { page, limit } = req.query;
  if (page !== undefined) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 25));
    const total = await User.countDocuments({ role: 'admin' });
    const data  = await User.find({ role: 'admin' }).select('-passwordHash').skip((p - 1) * l).limit(l);
    return res.json({ data, total, page: p, pages: Math.ceil(total / l), limit: l });
  }
  const admins = await User.find({ role: 'admin' }).select('-passwordHash');
  res.json(admins);
};

const createAdmin = async (req, res) => {
  const { name, username, mobile, password } = req.body;

  if (!name || !username || !mobile || !password) {
    return res.status(400).json({ message: 'Name, username, mobile and password are required' });
  }

  // ← REPLACED: Mock array find with MongoDB query
  const exists = await User.findOne({
    $or: [{ username }, { mobile }]
  });
  if (exists) {
    return res.status(409).json({ message: 'Admin with this username or mobile already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // ← REPLACED: Mock object push with MongoDB create
  const newAdmin = await User.create({
    name,
    username,
    mobile,
    passwordHash,
    role: 'admin',
  });

  // Return without passwordHash
  const safe = newAdmin.toObject();
  delete safe.passwordHash;
  res.status(201).json(safe);
};

const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, username, mobile, password } = req.body;

  // ← REPLACED: Mock array find with MongoDB query
  const admin = await User.findOne({ _id: id, role: 'admin' });
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  if (name) admin.name = name;
  if (username) admin.username = username;
  if (mobile) admin.mobile = mobile;
  if (password) admin.passwordHash = await bcrypt.hash(password, 10);

  await admin.save(); // ← CHANGED: Save to MongoDB

  // Return without passwordHash
  const safe = admin.toObject();
  delete safe.passwordHash;
  res.json(safe);
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  // ← REPLACED: Mock array splice with MongoDB deleteOne
  const result = await User.deleteOne({ _id: id, role: 'admin' });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  res.json({ message: 'Admin deleted successfully' });
};

module.exports = { getAdmins, createAdmin, updateAdmin, deleteAdmin };
