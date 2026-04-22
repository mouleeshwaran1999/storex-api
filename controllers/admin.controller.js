const bcrypt = require('bcryptjs');
const { stores, employees, generateId } = require('../data/mockData');

// ─── Stores ────────────────────────────────────────────────────────────────

const getStores = (req, res) => {
  res.json(stores);
};

const createStore = (req, res) => {
  const { name, address, gst, phone = '', footerNote = '', logo = null, employeeIds = [] } = req.body;

  if (!name || !address || !gst) {
    return res.status(400).json({ message: 'Name, address and GST are required' });
  }

  // Validate employee IDs exist
  for (const eid of employeeIds) {
    const emp = employees.find((e) => e.id === eid);
    if (!emp) {
      return res.status(400).json({ message: `Employee ${eid} not found` });
    }
  }

  const newStore = {
    id: generateId('store'),
    name,
    address,
    gst,
    phone,
    footerNote,
    logo,
    employeeIds,
  };

  stores.push(newStore);

  // Update each employee's storeId
  employeeIds.forEach((eid) => {
    const emp = employees.find((e) => e.id === eid);
    if (emp) emp.storeId = newStore.id;
  });

  res.status(201).json(newStore);
};

const updateStore = (req, res) => {
  const { id } = req.params;
  const { name, address, gst, phone, footerNote, logo, employeeIds } = req.body;

  const idx = stores.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Store not found' });
  }

  if (name) stores[idx].name = name;
  if (address) stores[idx].address = address;
  if (gst) stores[idx].gst = gst;
  if (phone !== undefined) stores[idx].phone = phone;
  if (footerNote !== undefined) stores[idx].footerNote = footerNote;
  if (logo !== undefined) stores[idx].logo = logo;

  if (employeeIds !== undefined) {
    // Validate employee IDs
    for (const eid of employeeIds) {
      const emp = employees.find((e) => e.id === eid);
      if (!emp) {
        return res.status(400).json({ message: `Employee ${eid} not found` });
      }
    }

    // Remove storeId from previously assigned employees
    stores[idx].employeeIds.forEach((eid) => {
      const emp = employees.find((e) => e.id === eid);
      if (emp) emp.storeId = null;
    });

    stores[idx].employeeIds = employeeIds;

    // Assign storeId to new employees
    employeeIds.forEach((eid) => {
      const emp = employees.find((e) => e.id === eid);
      if (emp) emp.storeId = stores[idx].id;
    });
  }

  res.json(stores[idx]);
};

const deleteStore = (req, res) => {
  const { id } = req.params;
  const idx = stores.findIndex((s) => s.id === id);

  if (idx === -1) {
    return res.status(404).json({ message: 'Store not found' });
  }

  // Clear storeId on assigned employees
  stores[idx].employeeIds.forEach((eid) => {
    const emp = employees.find((e) => e.id === eid);
    if (emp) emp.storeId = null;
  });

  stores.splice(idx, 1);
  res.json({ message: 'Store deleted successfully' });
};

// ─── Employees ─────────────────────────────────────────────────────────────

const getEmployees = (req, res) => {
  const safe = employees.map(({ passwordHash, ...rest }) => rest);
  res.json(safe);
};

const createEmployee = async (req, res) => {
  const { name, username, mobile, password, storeId } = req.body;

  if (!name || !username || !mobile || !password) {
    return res.status(400).json({ message: 'Name, username, mobile and password are required' });
  }

  const exists = employees.find((e) => e.username === username || e.mobile === mobile);
  if (exists) {
    return res.status(409).json({ message: 'Employee with this username or mobile already exists' });
  }

  if (storeId) {
    const store = stores.find((s) => s.id === storeId);
    if (!store) {
      return res.status(400).json({ message: 'Store not found' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newEmployee = {
    id: generateId('employee'),
    name,
    username,
    mobile,
    passwordHash,
    role: 'employee',
    storeId: storeId || null,
  };

  employees.push(newEmployee);

  if (storeId) {
    const store = stores.find((s) => s.id === storeId);
    if (store && !store.employeeIds.includes(newEmployee.id)) {
      store.employeeIds.push(newEmployee.id);
    }
  }

  const { passwordHash: _, ...safe } = newEmployee;
  res.status(201).json(safe);
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, username, mobile, password, storeId } = req.body;

  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  if (name) employees[idx].name = name;
  if (username) employees[idx].username = username;
  if (mobile) employees[idx].mobile = mobile;
  if (password) employees[idx].passwordHash = await bcrypt.hash(password, 10);

  if (storeId !== undefined) {
    const oldStoreId = employees[idx].storeId;

    if (oldStoreId) {
      const oldStore = stores.find((s) => s.id === oldStoreId);
      if (oldStore) {
        oldStore.employeeIds = oldStore.employeeIds.filter((eid) => eid !== id);
      }
    }

    if (storeId) {
      const newStore = stores.find((s) => s.id === storeId);
      if (!newStore) {
        return res.status(400).json({ message: 'Store not found' });
      }
      if (!newStore.employeeIds.includes(id)) {
        newStore.employeeIds.push(id);
      }
    }

    employees[idx].storeId = storeId;
  }

  const { passwordHash, ...safe } = employees[idx];
  res.json(safe);
};

const deleteEmployee = (req, res) => {
  const { id } = req.params;
  const idx = employees.findIndex((e) => e.id === id);

  if (idx === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const storeId = employees[idx].storeId;
  if (storeId) {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      store.employeeIds = store.employeeIds.filter((eid) => eid !== id);
    }
  }

  employees.splice(idx, 1);
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
