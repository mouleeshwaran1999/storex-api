const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getAdmins, createAdmin, updateAdmin, deleteAdmin } = require('../controllers/superAdmin.controller');

router.use(authenticate, authorize('super_admin'));

router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

module.exports = router;
