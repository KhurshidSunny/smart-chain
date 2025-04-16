const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const packageController = require('../controllers/packageController');

// Validation schema
const packageSchema = {
  orderId: 'required|string',
  packagingType: 'required|string',
  'dimensions.width': 'required|numeric|min:0',
  'dimensions.height': 'required|numeric|min:0',
  'dimensions.depth': 'required|numeric|min:0',
  'dimensions.weight': 'required|numeric|min:0',
  packedBy: 'required|string',
};

// Routes
router.post(
  '/',
  authMiddleware(['WarehouseStaff', 'SystemAdmin']),
  validate(packageSchema),
  packageController.createPackage
);

router.get(
  '/',
  authMiddleware(['WarehouseManager', 'SystemAdmin']),
  packageController.listPackages
);

router.get(
  '/:id',
  authMiddleware(['WarehouseManager', 'SystemAdmin']),
  packageController.getPackage
);

router.put(
  '/:id',
  authMiddleware(['WarehouseManager', 'SystemAdmin']),
  validate({
    packagingType: 'string',
    'dimensions.width': 'numeric|min:0',
    'dimensions.height': 'numeric|min:0',
    'dimensions.depth': 'numeric|min:0',
    'dimensions.weight': 'numeric|min:0',
  }),
  packageController.updatePackage
);

module.exports = router;