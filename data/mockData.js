const bcrypt = require('bcryptjs');

// In-memory mock data store

const admins = [
  {
    id: 'admin-1',
    name: 'Admin One',
    username: 'adminone',
    mobile: '9000000002',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
  },
];

const superAdmins = [
  {
    id: 'super-1',
    name: 'Super Admin',
    username: 'superadmin',
    mobile: '9000000001',
    passwordHash: bcrypt.hashSync('super123', 10),
    role: 'super_admin',
  },
];

const stores = [
  {
    id: 'store-1',
    name: 'Main Street Shop',
    address: '123 Main St, Chennai',
    gst: '33AABCS1429B1Z5',
    phone: '9876543210',
    footerNote: 'Thank you for shopping with us!',
    // SVG store-house icon encoded as base64 data-URL (128×128, indigo theme)
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIyNCIgZmlsbD0iIzYzNjZmMSIvPjxyZWN0IHg9IjIwIiB5PSI1NSIgd2lkdGg9Ijg4IiBoZWlnaHQ9IjUwIiByeD0iNiIgZmlsbD0iI2ZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMTAsNjAgNjQsMjAgMTE4LDYwIiBmaWxsPSIjNGY0NmU1Ii8+PHJlY3QgeD0iNDgiIHk9Ijc1IiB3aWR0aD0iMzIiIGhlaWdodD0iMzAiIHJ4PSI0IiBmaWxsPSIjYzdkMmZlIi8+PHJlY3QgeD0iMzAiIHk9IjY4IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIzIiBmaWxsPSIjZTBlN2ZmIi8+PHJlY3QgeD0iNzgiIHk9IjY4IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIzIiBmaWxsPSIjZTBlN2ZmIi8+PC9zdmc+',
    employeeIds: ['emp-1'],
  },
];

const employees = [
  {
    id: 'emp-1',
    name: 'Employee One',
    username: 'emp1',
    mobile: '9000000003',
    passwordHash: bcrypt.hashSync('emp123', 10),
    role: 'employee',
    storeId: 'store-1',
  },
];

const products = [
  {
    id: 'prod-1',
    name: 'Product A',
    price: 100,
    stock: 50,
    storeId: 'store-1',
  },
];

const bills = [];

let idCounters = {
  admin: 2,
  store: 2,
  employee: 2,
  product: 2,
  bill: 1,
};


const generateId = (prefix) => {
  const key = prefix;
  const id = `${prefix}-${idCounters[key]}`;
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
