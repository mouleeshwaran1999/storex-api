const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/admin.controller');
const { getStoreReportForAdmin } = require('../controllers/report.controller');

router.use(authenticate, authorize('admin'));

router.get('/stores', getStores);
router.post('/stores', createStore);
router.put('/stores/:id', updateStore);
router.delete('/stores/:id', deleteStore);
router.get('/stores/:id/report', getStoreReportForAdmin);

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

module.exports = router;
