#!/usr/bin/env node

/**
 * MongoDB Migration Verification Script
 * 
 * This script verifies that the MongoDB migration was successful
 * Run: node scripts/verify-migration.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const StockLog = require('../models/StockLog');

async function verifyMigration() {
  console.log('🔍 Starting MongoDB Migration Verification...\n');

  try {
    // Check environment variables
    console.log('1️⃣ Checking Environment Variables...');
    if (!process.env.MONGO_URI) {
      console.error('   ❌ MONGO_URI not found in environment');
      console.log('   💡 Create .env file with MONGO_URI=mongodb://localhost:27017/storex');
      process.exit(1);
    }
    console.log('   ✅ MONGO_URI found');
    
    if (!process.env.JWT_SECRET) {
      console.warn('   ⚠️  JWT_SECRET not found (required for authentication)');
    } else {
      console.log('   ✅ JWT_SECRET found');
    }
    console.log('');

    // Connect to MongoDB
    console.log('2️⃣ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   ✅ Connected to MongoDB successfully');
    console.log('');

    // Check collections
    console.log('3️⃣ Verifying Collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['users', 'stores', 'products'];
    const optionalCollections = ['bills', 'stocklogs'];
    
    requiredCollections.forEach(name => {
      if (collectionNames.includes(name)) {
        console.log(`   ✅ Collection '${name}' exists`);
      } else {
        console.log(`   ⚠️  Collection '${name}' not found (will be created on first use)`);
      }
    });
    console.log('');

    // Check seeded data
    console.log('4️⃣ Verifying Seeded Data...');
    
    const userCount = await User.countDocuments();
    console.log(`   📊 Users: ${userCount} document(s)`);
    if (userCount === 0) {
      console.log('   ⚠️  No users found. Run the server to auto-seed.');
    } else {
      const superAdmin = await User.findOne({ role: 'super_admin' });
      const admin = await User.findOne({ role: 'admin' });
      const employee = await User.findOne({ role: 'employee' });
      
      console.log(`      ${superAdmin ? '✅' : '❌'} Super Admin exists`);
      console.log(`      ${admin ? '✅' : '❌'} Admin exists`);
      console.log(`      ${employee ? '✅' : '❌'} Employee exists`);
    }
    
    const storeCount = await Store.countDocuments();
    console.log(`   📊 Stores: ${storeCount} document(s)`);
    if (storeCount > 0) {
      const store = await Store.findOne();
      console.log(`      ✅ Sample store: "${store.name}"`);
      console.log(`      ✅ Admin ID assigned: ${store.adminId ? 'Yes' : 'No'}`);
    }
    
    const productCount = await Product.countDocuments();
    console.log(`   📊 Products: ${productCount} document(s)`);
    if (productCount > 0) {
      const products = await Product.find().limit(2);
      products.forEach(p => {
        console.log(`      ✅ Product: "${p.name}" (Stock: ${p.stock}, Price: ${p.price})`);
      });
    }
    
    const billCount = await Bill.countDocuments();
    console.log(`   📊 Bills: ${billCount} document(s)`);
    
    const logCount = await StockLog.countDocuments();
    console.log(`   📊 Stock Logs: ${logCount} document(s)`);
    console.log('');

    // Check indexes
    console.log('5️⃣ Verifying Indexes...');
    const userIndexes = await User.collection.getIndexes();
    console.log(`   ✅ User indexes: ${Object.keys(userIndexes).length}`);
    
    const storeIndexes = await Store.collection.getIndexes();
    console.log(`   ✅ Store indexes: ${Object.keys(storeIndexes).length}`);
    
    const productIndexes = await Product.collection.getIndexes();
    console.log(`   ✅ Product indexes: ${Object.keys(productIndexes).length}`);
    console.log('');

    // Check relationships
    console.log('6️⃣ Verifying Data Relationships...');
    const employees = await User.find({ role: 'employee' });
    let relationshipsOk = true;
    
    for (const emp of employees) {
      if (!emp.storeId) {
        console.log(`   ❌ Employee "${emp.username}" has no storeId`);
        relationshipsOk = false;
      } else {
        const store = await Store.findById(emp.storeId);
        if (!store) {
          console.log(`   ❌ Employee "${emp.username}" storeId references non-existent store`);
          relationshipsOk = false;
        }
      }
    }
    
    const stores = await Store.find();
    for (const store of stores) {
      if (!store.adminId) {
        console.log(`   ❌ Store "${store.name}" has no adminId`);
        relationshipsOk = false;
      } else {
        const admin = await User.findById(store.adminId);
        if (!admin) {
          console.log(`   ❌ Store "${store.name}" adminId references non-existent admin`);
          relationshipsOk = false;
        }
      }
    }
    
    const products = await Product.find();
    for (const product of products) {
      if (!product.storeId) {
        console.log(`   ❌ Product "${product.name}" has no storeId`);
        relationshipsOk = false;
      }
    }
    
    if (relationshipsOk) {
      console.log('   ✅ All data relationships are valid');
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Migration Verification Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (userCount === 0) {
      console.log('\n💡 Next Step: Start the server to auto-seed default users:');
      console.log('   npm start');
    } else {
      console.log('\n✅ Database is ready for use!');
      console.log('\n📝 Default Credentials:');
      console.log('   Super Admin: superadmin / superadmin');
      console.log('   Admin:       admin / admin');
      console.log('   Employee:    employee / employee');
    }
    
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run verification
verifyMigration();
