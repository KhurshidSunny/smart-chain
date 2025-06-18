const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateOrder } = require('../middleware/validate');

router.post('/orders', authMiddleware, validateOrder, createOrder);
router.get('/orders', authMiddleware, getOrders);
router.get('/orders/:id', authMiddleware, getOrderById);
router.put('/orders/:id/status', authMiddleware, updateOrderStatus);

module.exports = router;