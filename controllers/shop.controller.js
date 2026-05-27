const Store = require('../models/Store'); // ← REPLACED: Mock data with MongoDB Store model

// ================================================================
// SHOP CONTROLLER
// ================================================================
// DATA ACCESS ENFORCEMENT:
// - Returns store details based on req.user.storeId
// - Employee can ONLY see their assigned store
// - Backend is the source of truth for store assignment
// ================================================================

const getShop = async (req, res) => {
  const { storeId } = req.user;

  if (!storeId) {
    return res.status(400).json({ message: 'No store assigned to this user' });
  }

  // ← REPLACED: Mock array find with MongoDB query
  // CRITICAL: Fetch store ONLY by storeId from authenticated user
  const store = await Store.findById(storeId);
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }

  res.json(store);
};

module.exports = { getShop };
