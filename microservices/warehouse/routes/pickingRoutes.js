const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const pickingController = require('../controllers/pickingController');

// List picking lists
router.get(
  '/',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.listPickingLists
);

// Get picking list details
router.get(
  '/:id',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.getPickingList
);

// Update picking list status
router.put(
  '/:id/status',
  authMiddleware(['warehouse_manager', 'admin']),
  validate('updatePickingListStatus'),
  pickingController.updatePickingListStatus
);

// Assign picking list to staff
router.put(
  '/:id/assign',
  authMiddleware(['warehouse_manager', 'admin']),
  validate('assignPickingList'),
  pickingController.assignPickingList
);

// Update picked quantity
router.put(
  '/:id/items/:itemId',
  authMiddleware(['warehouse_staff', 'admin']),
  validate('updatePickedQuantity'),
  pickingController.updatePickedQuantity
);

module.exports = router;