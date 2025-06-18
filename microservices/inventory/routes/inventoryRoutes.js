const express = require('express');
const router = express.Router();
const { reservationController, adjustmentController, productController, inventoryController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { validateReservation, validateAdjustment } = require('../middleware/validate');

// Summary route - should come before the general inventory route
router.get('/summary', authMiddleware, inventoryController.getInventorySummary);
router.get('/transactions', authMiddleware, adjustmentController.getTransactions);
router.get('/', authMiddleware, inventoryController.getInventory);
router.get('/:productId', authMiddleware, inventoryController.getProductInventory);
router.put('/reserve', authMiddleware, validateReservation, reservationController.reserveInventory);
router.put('/release', authMiddleware, reservationController.releaseInventory);
router.put('/adjust', authMiddleware, validateAdjustment, adjustmentController.adjustInventory);

module.exports = router;