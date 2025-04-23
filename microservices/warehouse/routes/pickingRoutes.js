const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const pickingController = require('../controllers/pickingController');

// Validation schemas
const pickingSchema = {
  orderId: 'required|string',
  orderNumber: 'required|string',
  items: 'required|array',
  'items.*.productId': 'required|string',
  'items.*.sku': 'required|string',
  'items.*.name': 'required|string',
  'items.*.quantity': 'required|numeric|min:1',
  'items.*.location': 'required|string',
};

// Routes
router.post(
  '/',
  authMiddleware(['warehouse_manager', 'admin']),
  validate(pickingSchema),
  pickingController.generatePickingList
);

router.get(
  '/',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.listPickingLists
);

router.get(
  '/:id',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.getPickingList
);

router.put(
  '/:id/status',
  authMiddleware(['warehouse_manager', 'admin']),
  validate({ status: 'required|string|in:Pending,InProgress,Completed,Cancelled' }),
  pickingController.updatePickingListStatus
);

router.put(
  '/:id/assign',
  authMiddleware(['warehouse_manager', 'admin']),
  validate({ assignedTo: 'required|string' }),
  pickingController.assignPickingList
);

router.put(
  '/:id/items/:itemId',
  authMiddleware(['warehouse_staff', 'admin']),
  validate({ picked: 'required|numeric|min:0' }),
  pickingController.updatePickedQuantity
);

module.exports = router;