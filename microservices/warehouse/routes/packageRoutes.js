const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const packageController = require('../controllers/packageController');
const Joi = require('joi');

// Validation schemas using Joi
const packageSchema = {
  orderId: Joi.string().required(),
  packagingType: Joi.string().required(),
  dimensions: Joi.object({
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
    depth: Joi.number().min(0).required(),
    weight: Joi.number().min(0).required()
  }).required(),
  packedBy: Joi.string().required()
};

const updatePackageSchema = {
  packagingType: Joi.string().optional(),
  dimensions: Joi.object({
    width: Joi.number().min(0).optional(),
    height: Joi.number().min(0).optional(),
    depth: Joi.number().min(0).optional(),
    weight: Joi.number().min(0).optional()
  }).optional()
};

// Routes

// Create package record
router.post(
  '/',
  authMiddleware(['warehouse_staff', 'admin']),
  validate(packageSchema),
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
  validate(updatePackageSchema),
  packageController.updatePackage
);

module.exports = router;