const { stores } = require('../data/mockData');

const getShop = (req, res) => {
  const { storeId } = req.user;

  if (!storeId) {
    return res.status(400).json({ message: 'No store assigned to this user' });
  }

  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }

  res.json(store);
};

module.exports = { getShop };
