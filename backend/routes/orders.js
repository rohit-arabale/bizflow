const express = require('express');
const router = express.Router();
const { getOrders, createOrder, getOrder, updateOrderStatus, publicCreateOrder, trackOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/public/:businessSlug', publicCreateOrder);
router.get('/track/:orderNumber', trackOrder);

// Protected routes
router.use(protect);
router.route('/').get(getOrders).post(createOrder);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
