const bcrypt = require('bcryptjs');

// In-memory mock data store

// ================================================================
// SUPER ADMIN
// Credentials: superadmin / superadmin
// ================================================================
const superAdmins = [
  {
    id: 1,
    name: 'Super Admin',
    username: 'superadmin',
    mobile: '9000000001',
    passwordHash: bcrypt.hashSync('superadmin', 10),
    role: 'super_admin',
  },
];

// ================================================================
// ADMINS
// Credentials: admin / admin
// ================================================================
const admins = [
  {
    id: 2,
    name: 'Admin User',
    username: 'admin',
    mobile: '9000000002',
    passwordHash: bcrypt.hashSync('admin', 10),
    role: 'admin',
  },
];

// ================================================================
// STORES
// Schema: id, name, address, gst, phone, footerNote, logo, adminId (MANDATORY), employeeIds
// Store MUST have adminId - cannot exist without an Admin
// ================================================================
const stores = [
  {
    id: 3,
    name: 'Main Street Shop',
    address: '123 Main St, Chennai',
    gst: '33AABCS1429B1Z5',
    phone: '9876543210',
    footerNote: 'Thank you for shopping with us!',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIyNCIgZmlsbD0iIzYzNjZmMSIvPjxyZWN0IHg9IjIwIiB5PSI1NSIgd2lkdGg9Ijg4IiBoZWlnaHQ9IjUwIiByeD0iNiIgZmlsbD0iI2ZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMTAsNjAgNjQsMjAgMTE4LDYwIiBmaWxsPSIjNGY0NmU1Ii8+PHJlY3QgeD0iNDgiIHk9Ijc1IiB3aWR0aD0iMzIiIGhlaWdodD0iMzAiIHJ4PSI0IiBmaWxsPSIjYzdkMmZlIi8+PHJlY3QgeD0iMzAiIHk9IjY4IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIzIiBmaWxsPSIjZTBlN2ZmIi8+PHJlY3QgeD0iNzgiIHk9IjY4IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIzIiBmaWxsPSIjZTBlN2ZmIi8+PC9zdmc+',
    adminId: 2, // MANDATORY - Store belongs to this admin
    employeeIds: [4],
  },
];

// ================================================================
// EMPLOYEES
// Credentials: employee / employee
// Schema: id, name, username, mobile, passwordHash, role, storeId (MANDATORY)
// Employee MUST be mapped to exactly ONE Store
// Employee cannot log in without valid storeId
// ================================================================
const employees = [
  {
    id: 4,
    name: 'Employee User',
    username: 'employee',
    mobile: '9000000003',
    passwordHash: bcrypt.hashSync('employee', 10),
    role: 'employee',
    storeId: 3, // MANDATORY - Employee belongs to this store
  },
];

// ================================================================
// PRODUCTS
// Schema: id, name, price, stock, storeId (MANDATORY)
// Product MUST belong to exactly ONE Store
// Products are NEVER global - always store-scoped
// ================================================================
const products = [
  {
    id: 5,
    name: 'Product A',
    price: 100,
    stock: 50,
    storeId: 3, // MANDATORY - Product belongs to this store
  },
  {
    id: 6,
    name: 'Product B',
    price: 250,
    stock: 30,
    storeId: 3,
  },
];

const bills = [];

let idCounters = {
  superAdmin: 2,
  admin: 3,
  store: 4,
  employee: 5,
  product: 7,
  bill: 1,
};


const generateId = (prefix) => {
  const key = prefix;
  const id = idCounters[key];
  idCounters[key]++;
  return id;
};

module.exports = {
  admins,
  superAdmins,
  stores,
  employees,
  products,
  bills,
  generateId,
};
