const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles, objectIdParam, pathLimits } = require('../sharedLoad');
const { validateProduct, validateProductUpdate } = require('../middleware/validate');

const catalogWriters = requireRoles('admin', 'inventory_manager');

router.post('/', authMiddleware, catalogWriters, validateProduct, productController.createProduct);
router.get('/', authMiddleware, productController.getProducts);
router.get('/:id', authMiddleware, pathLimits, objectIdParam('id'), productController.getProductById);
router.put('/:id', authMiddleware, catalogWriters, pathLimits, objectIdParam('id'), validateProductUpdate, productController.updateProduct);
router.delete('/:id', authMiddleware, catalogWriters, pathLimits, objectIdParam('id'), productController.deleteProduct);

module.exports = router;