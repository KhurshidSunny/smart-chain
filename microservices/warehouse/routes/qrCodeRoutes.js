const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const qrCodeController = require('../controllers/qrCodeController');

// Validation schema
const qrCodeSchema = {
  entityType: 'required|string|in:Order,Package,Product',
  entityId: 'required|string',
};

// Routes
router.post(
  '/',
  authMiddleware(['WarehouseStaff', 'SystemAdmin']),
  validate(qrCodeSchema),
  qrCodeController.generateQRCode
);

router.get(
  '/:code',
  authMiddleware(['WarehouseManager', 'WarehouseStaff', 'SystemAdmin']),
  qrCodeController.getQRCode
);

router.post(
  '/:code/scan',
  authMiddleware(['WarehouseStaff', 'SystemAdmin']),
  validate({
    location: 'required|string',
    scannedBy: 'required|string',
  }),
  qrCodeController.recordQRCodeScan
);

router.get(
  '/:code/history',
  authMiddleware(['WarehouseManager', 'SystemAdmin']),
  qrCodeController.getQRCodeHistory
);

module.exports = router;