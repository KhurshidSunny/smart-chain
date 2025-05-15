const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { validateProduct, validateProductUpdate } = require('../middleware/validate');

router.post('/', authMiddleware, validateProduct, productController.createProduct);
router.get('/', authMiddleware, productController.getProducts);
router.get('/:id', authMiddleware, productController.getProductById);
router.put('/:id', authMiddleware, validateProductUpdate, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;