const { stores } = require('../data/mockData');

// ================================================================
// SHOP CONTROLLER
// ================================================================
// DATA ACCESS ENFORCEMENT:
// - Returns store details based on req.user.storeId
// - Employee can ONLY see their assigned store
// - Backend is the source of truth for store assignment
// ================================================================

const getShop = (req, res) => {
  const { storeId } = req.user;

  if (!storeId) {
    return res.status(400).json({ message: 'No store assigned to this user' });
  }

  // CRITICAL: Fetch store ONLY by storeId from authenticated user
  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }

  res.json(store);
};

module.exports = { getShop };
