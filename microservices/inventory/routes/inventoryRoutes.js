const express = require('express');
const router = express.Router();
const { reservationController, adjustmentController, productController, inventoryController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles, objectIdParam, pathLimits } = require('../sharedLoad');
const { validateReservation, validateAdjustment } = require('../middleware/validate');

const inventoryStaff = requireRoles('admin', 'inventory_manager');

router.get('/summary', authMiddleware, inventoryStaff, inventoryController.getInventorySummary);
router.get('/transactions', authMiddleware, inventoryStaff, adjustmentController.getTransactions);
router.get('/', authMiddleware, inventoryStaff, inventoryController.getInventory);
router.get('/:productId', authMiddleware, inventoryStaff, pathLimits, objectIdParam('productId'), inventoryController.getProductInventory);
router.put('/reserve', authMiddleware, inventoryStaff, validateReservation, reservationController.reserveInventory);
router.put('/release', authMiddleware, inventoryStaff, reservationController.releaseInventory);
router.put('/adjust', authMiddleware, inventoryStaff, validateAdjustment, adjustmentController.adjustInventory);

module.exports = router;