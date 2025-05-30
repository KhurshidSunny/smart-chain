const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const packageController = require('../controllers/packageController');

// Create package record
router.post(
  '/',
  authMiddleware(['warehouse_staff', 'admin']),
  validate('createPackage'),
  packageController.createPackage
);

// List packages
router.get(
  '/',
  authMiddleware(['warehouse_manager', 'admin']),
  packageController.listPackages
);

// Get package details
router.get(
  '/:id',
  authMiddleware(['warehouse_manager', 'admin']),
  packageController.getPackage
);

// Update package info
router.put(
  '/:id',
  authMiddleware(['warehouse_manager', 'admin']),
  validate('updatePackage'),
  packageController.updatePackage
);

module.exports = router;