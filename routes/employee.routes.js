const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getBills,
  createBill,
} = require('../controllers/employee.controller');

router.use(authenticate, authorize('employee'));

router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.post('/stock/adjust', adjustStock);

router.get('/bills', getBills);
router.post('/bills', createBill);

module.exports = router;
