const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Store = require('../models/Store');

// ================================================================
// ADMIN CONTROLLER (multi-tenant)
// ================================================================
// Every admin only sees / mutates the stores and employees they
// themselves created. Ownership is tracked via:
//   - Store.adminId  -> User._id (the admin)
//   - User.adminId   -> User._id (the admin who created this employee)
//
// All handlers derive the current admin from req.user.userId
// (set by auth middleware from the JWT).
// ================================================================

const adminId = (req) => Number(req.user.userId);

// ─── Stores ────────────────────────────────────────────────────────────────

const getStores = async (req, res) => {
  const stores = await Store.find({ adminId: adminId(req) });
  res.json(stores);
};

const createStore = async (req, res) => {
  const { name, address, gst, phone = '', footerNote = '', logo = null, employeeIds = [] } = req.body;
  const owner = adminId(req);

  if (!name || !address || !gst) {
    return res.status(400).json({ message: 'Name, address and GST are required' });
  }

  // Restrict provided employees to those owned by THIS admin
  if (employeeIds && employeeIds.length > 0) {
    const owned = await User.find({
      _id: { $in: employeeIds },
      role: 'employee',
      adminId: owner,
    }).select('_id');
    if (owned.length !== employeeIds.length) {
      return res.status(400).json({ message: 'One or more employees do not belong to you' });
    }
  }

  const newStore = await Store.create({
    name,
    address,
    gstNumber: gst,
    phone,
    footerNote,
    logoUrl: logo,
    adminId: owner,
  });

  if (employeeIds && employeeIds.length > 0) {
    await User.updateMany(
      { _id: { $in: employeeIds }, role: 'employee', adminId: owner },
      { $set: { storeId: newStore._id } }
    );
  }

  res.status(201).json(newStore);
};

const updateStore = async (req, res) => {
  const { id } = req.params;
  const owner = adminId(req);
  const { name, address, gst, phone, footerNote, logo, employeeIds } = req.body;

  const store = await Store.findOne({ _id: id, adminId: owner });
  if (!store) return res.status(404).json({ message: 'Store not found' });

  if (name) store.name = name;
  if (address) store.address = address;
  if (gst) store.gstNumber = gst;
  if (phone !== undefined) store.phone = phone;
  if (footerNote !== undefined) store.footerNote = footerNote;
  if (logo !== undefined) store.logoUrl = logo;

  if (employeeIds !== undefined) {
    // Verify all employeeIds belong to this admin
    if (employeeIds.length > 0) {
      const owned = await User.find({
        _id: { $in: employeeIds },
        role: 'employee',
        adminId: owner,
      }).select('_id');
      if (owned.length !== employeeIds.length) {
        return res.status(400).json({ message: 'One or more employees do not belong to you' });
      }
    }

    // Unassign previously-assigned employees of this store (within this admin)
    await User.updateMany(
      { storeId: store._id, role: 'employee', adminId: owner },
      { $set: { storeId: null } }
    );
    // Assign new selection
    if (employeeIds.length > 0) {
      await User.updateMany(
        { _id: { $in: employeeIds }, role: 'employee', adminId: owner },
        { $set: { storeId: store._id } }
      );
    }
  }

  await store.save();
  res.json(store);
};

const deleteStore = async (req, res) => {
  const { id } = req.params;
  const owner = adminId(req);

  const store = await Store.findOne({ _id: id, adminId: owner });
  if (!store) return res.status(404).json({ message: 'Store not found' });

  // Unassign employees that were attached to this store
  await User.updateMany(
    { storeId: store._id, role: 'employee', adminId: owner },
    { $set: { storeId: null } }
  );

  await Store.deleteOne({ _id: id });
  res.json({ message: 'Store deleted successfully' });
};

// ─── Employees ─────────────────────────────────────────────────────────────

const getEmployees = async (req, res) => {
  const employees = await User
    .find({ role: 'employee', adminId: adminId(req) })
    .select('-passwordHash');
  res.json(employees);
};

const createEmployee = async (req, res) => {
  const { name, username, mobile, password, storeId } = req.body;
  const owner = adminId(req);

  if (!name || !username || !mobile || !password) {
    return res.status(400).json({ message: 'Name, username, mobile and password are required' });
  }
  if (!storeId) {
    return res.status(400).json({ message: 'storeId is required - Employee must be mapped to a store' });
  }

  // Store must belong to this admin
  const store = await Store.findOne({ _id: storeId, adminId: owner });
  if (!store) {
    return res.status(400).json({ message: 'Store not found or does not belong to you' });
  }

  const exists = await User.findOne({ $or: [{ username }, { mobile }] });
  if (exists) {
    return res.status(409).json({ message: 'Employee with this username or mobile already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newEmployee = await User.create({
    name,
    username,
    mobile,
    passwordHash,
    role: 'employee',
    storeId,
    adminId: owner,
  });

  const safe = newEmployee.toObject();
  delete safe.passwordHash;
  res.status(201).json(safe);
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const owner = adminId(req);
  const { name, username, mobile, password, storeId } = req.body;

  const employee = await User.findOne({ _id: id, role: 'employee', adminId: owner });
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  if (name) employee.name = name;
  if (username) employee.username = username;
  if (mobile) employee.mobile = mobile;
  if (password) employee.passwordHash = await bcrypt.hash(password, 10);

  if (storeId !== undefined) {
    if (!storeId) {
      return res.status(400).json({ message: 'storeId is required - Employee must be mapped to a store' });
    }
    const newStore = await Store.findOne({ _id: storeId, adminId: owner });
    if (!newStore) {
      return res.status(400).json({ message: 'Store not found or does not belong to you' });
    }
    employee.storeId = storeId;
  }

  await employee.save();
  const safe = employee.toObject();
  delete safe.passwordHash;
  res.json(safe);
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  const owner = adminId(req);

  const result = await User.deleteOne({ _id: id, role: 'employee', adminId: owner });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  res.json({ message: 'Employee deleted successfully' });
};

module.exports = {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
