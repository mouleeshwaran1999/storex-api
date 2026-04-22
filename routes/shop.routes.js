const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getShop } = require('../controllers/shop.controller');

router.get('/shop', authenticate, authorize('employee'), getShop);

module.exports = router;
