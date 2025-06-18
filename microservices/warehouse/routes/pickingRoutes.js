const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const pickingController = require('../controllers/pickingController');

// List picking lists - all roles can access (filtered by role in controller)
router.get(
  '/',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.listPickingLists
);

// Get picking list details - all roles can access (filtered by role in controller)
router.get(
  '/:id',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  pickingController.getPickingList
);

// Update picking list status - warehouse staff can update their own, managers/admins can update any
router.put(
  '/:id/status',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  validate('updatePickingListStatus'),
  pickingController.updatePickingListStatus
);

// Assign picking list to staff - only managers and admins
router.put(
  '/:id/assign',
  authMiddleware(['warehouse_manager', 'admin', 'warehouse_staff']),
  validate('assignPickingList'),
  pickingController.assignPickingList
);

// Update picked quantity - warehouse staff can update their own, admins can update any
router.put(
  '/:id/items/:itemId',
  authMiddleware(['warehouse_staff', 'warehouse_manager', 'admin']),
  validate('updatePickedQuantity'),
  pickingController.updatePickedQuantity
);

module.exports = router;