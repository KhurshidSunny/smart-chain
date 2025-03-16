const express = require('express');
const router = express.Router();
const { reservationController, adjustmentController, productController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { validateReservation, validateAdjustment } = require('../middleware/validate');

router.get('/inventory', authMiddleware, productController.getProducts);
router.get('/inventory/:productId', authMiddleware, productController.getProductById);
router.put('/inventory/reserve', authMiddleware, validateReservation, reservationController.reserveInventory);
router.put('/inventory/release', authMiddleware, reservationController.releaseInventory);
router.put('/inventory/adjust', authMiddleware, validateAdjustment, adjustmentController.adjustInventory);
router.get('/inventory/transactions', authMiddleware, adjustmentController.getTransactions);

module.exports = router;