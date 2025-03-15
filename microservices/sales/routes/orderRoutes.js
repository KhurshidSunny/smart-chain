const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateOrder } = require('../middleware/validate');

router.post('/api/orders', authMiddleware, validateOrder, createOrder);
router.get('/api/orders', authMiddleware, getOrders);
router.get('/api/orders/:id', authMiddleware, getOrderById);
router.put('/api/orders/:id/status', authMiddleware, updateOrderStatus);

module.exports = router;