require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const seedDatabase = require('./config/seed');

const authRoutes = require('./routes/auth.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const shopRoutes = require('./routes/shop.routes');

const app = express();

// ================================================================
// MONGODB CONNECTION
// ================================================================
// Connect to MongoDB and seed database if empty
// Server starts even if MongoDB is temporarily unavailable
// ================================================================
connectDB().then(() => {
  // Seed database with default users if empty
  seedDatabase().catch(err => {
    console.error('Seeding error (non-fatal):', err.message);
  });
});

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));
// Raise JSON body limit to 10 MB to support base64 logo uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', employeeRoutes);
app.use('/api', shopRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err.message);
  console.error(err.stack);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
  }
  if (err && err.code === 11000) {
    // Duplicate key on a unique index — surface a friendly message
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = (err.keyValue && err.keyValue[field]) || '';
    return res.status(409).json({
      message: `Duplicate ${field}${value !== '' ? ` "${value}"` : ''} — must be unique`,
    });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
