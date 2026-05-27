const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const StockLog = require('../models/StockLog');

// ================================================================
// DATABASE SEEDING SCRIPT
// ================================================================
// Seeds ONLY the bootstrap Super Admin account. All other data
// (admins, stores, employees, products, bills) is created
// interactively through the UI.
//
// IDs are auto-incremented integers via the Counter helper.
// If legacy ObjectId-based data is detected, all collections are
// dropped and re-seeded.
//
// Default credentials:
//   Super Admin: superadmin / superadmin
// ================================================================

const hasLegacyObjectIdData = async () => {
  const models = [User, Store, Product, Bill, StockLog];
  for (const Model of models) {
    const doc = await Model.collection.findOne({}, { projection: { _id: 1 } });
    if (doc && typeof doc._id !== 'number') return true;
  }
  return false;
};

const dropLegacyCollections = async () => {
  const names = ['users', 'stores', 'products', 'bills', 'stocklogs', 'counters'];
  const existing = (await mongoose.connection.db.listCollections().toArray()).map(c => c.name);
  for (const name of names) {
    if (existing.includes(name)) {
      await mongoose.connection.db.dropCollection(name);
      console.log(`🗑️  Dropped legacy collection: ${name}`);
    }
  }
};

// Removes the demo "admin" / "employee" / "Main Street Shop" / sample
// products that earlier versions of the seed used to insert. Idempotent
// and safe to run on every startup.
const cleanupLegacyMockData = async () => {
  const demoAdmin = await User.findOne({ username: 'admin', role: 'admin' });
  const demoStore = await Store.findOne({ name: 'Main Street Shop' });

  let removed = 0;

  if (demoStore) {
    // Wipe everything that depends on this demo store
    const prodIds = (await Product.find({ storeId: demoStore._id }).select('_id')).map(p => p._id);
    if (prodIds.length) {
      await StockLog.deleteMany({ productId: { $in: prodIds } });
      await Product.deleteMany({ _id: { $in: prodIds } });
      removed += prodIds.length;
    }
    await Bill.deleteMany({ storeId: demoStore._id });
    await User.deleteMany({ storeId: demoStore._id, role: 'employee' });
    await Store.deleteOne({ _id: demoStore._id });
    removed += 1;
  }

  // Remove the demo employee even if the demo store was already gone
  const empRes = await User.deleteOne({ username: 'employee', role: 'employee' });
  removed += empRes.deletedCount;

  if (demoAdmin) {
    await User.deleteOne({ _id: demoAdmin._id });
    removed += 1;
  }

  if (removed > 0) {
    console.log(`🧹 Removed ${removed} legacy mock record(s).`);
  }
};

const seedDatabase = async () => {
  try {
    if (await hasLegacyObjectIdData()) {
      console.log('⚠️  Legacy ObjectId data detected — migrating to numeric IDs...');
      await dropLegacyCollections();
    }

    // ─── One-time cleanup of previously-seeded mock data ──────
    // Removes the original sample admin, employee, store and
    // products that the old seed used to insert. Anything that
    // the user has created themselves through the UI is left
    // untouched.
    await cleanupLegacyMockData();

    const superAdminExists = await User.exists({ role: 'super_admin' });
    if (superAdminExists) {
      console.log('📊 Super Admin already exists, skipping seed.');
      return;
    }

    console.log('🌱 Seeding Super Admin...');
    await User.create({
      name: 'Super Admin',
      username: 'superadmin',
      mobile: '9000000001',
      passwordHash: await bcrypt.hash('superadmin', 10),
      role: 'super_admin',
    });
    console.log('✅ Created Super Admin');
    console.log('');
    console.log('Bootstrap credentials:');
    console.log('  Super Admin: superadmin / superadmin');
    console.log('  (Create admins, stores, employees, and products through the UI.)');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
};

module.exports = seedDatabase;
