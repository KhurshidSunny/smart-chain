const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const pickingController = require('../controllers/pickingController');
const Joi = require('joi');

// Validation schemas using Joi
const pickingSchema = {
  orderId: Joi.string().required(),
  orderNumber: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      sku: Joi.string().required(),
      name: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      location: Joi.string().required()
    })
  ).required()
};

const statusSchema = {
  status: Joi.string().valid('Pending', 'InProgress', 'Completed', 'Cancelled').required()
};

const assignSchema = {
  assignedTo: Joi.string().required()
};

const pickedQuantitySchema = {
  picked: Joi.number().min(0).required()
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
  validate(statusSchema),
  pickingController.updatePickingListStatus
);

router.put(
  '/:id/assign',
  authMiddleware(['warehouse_manager', 'admin']),
  validate(assignSchema),
  pickingController.assignPickingList
);

router.put(
  '/:id/items/:itemId',
  authMiddleware(['warehouse_staff', 'admin']),
  validate(pickedQuantitySchema),
  pickingController.updatePickedQuantity
);

module.exports = router;