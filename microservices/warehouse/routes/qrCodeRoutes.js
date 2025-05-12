const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const qrCodeController = require('../controllers/qrCodeController');
const Joi = require('joi');

// Validation schemas using Joi
const qrCodeSchema = {
  entityType: Joi.string().valid('Order', 'Package', 'Product').required(),
  entityId: Joi.string().required()
};

const scanSchema = {
  location: Joi.string().required(),
  scannedBy: Joi.string().required()
};

// Routes
router.post(
  '/',
  authMiddleware(['warehouse_staff', 'admin']),
  validate(qrCodeSchema),
  qrCodeController.generateQRCode
);

router.get(
  '/:code',
  authMiddleware(['warehouse_manager', 'warehouse_staff', 'admin']),
  qrCodeController.getQRCode
);

router.post(
  '/:code/scan',
  authMiddleware(['warehouse_staff', 'admin']),
  validate(scanSchema),
  qrCodeController.recordQRCodeScan
);

router.get(
  '/:code/history',
  authMiddleware(['warehouse_manager', 'admin']),
  qrCodeController.getQRCodeHistory
);

module.exports = router;