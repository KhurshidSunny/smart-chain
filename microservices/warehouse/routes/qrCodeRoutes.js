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
  validate({
    location: 'required|string',
    scannedBy: 'required|string',
  }),
  qrCodeController.recordQRCodeScan
);

router.get(
  '/:code/history',
  authMiddleware(['warehouse_manager', 'admin']),
  qrCodeController.getQRCodeHistory
);

module.exports = router;