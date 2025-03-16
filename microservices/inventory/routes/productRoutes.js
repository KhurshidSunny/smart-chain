const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const authMiddleware = require('../middleware/authMiddleware');
const { validateProduct, validateProductUpdate } = require('../middleware/validate');

router.post('/products', authMiddleware, validateProduct, productController.createProduct);
router.get('/products', authMiddleware, productController.getProducts);
router.get('/products/:id', authMiddleware, productController.getProductById);
router.put('/products/:id', authMiddleware, validateProductUpdate, productController.updateProduct);
router.delete('/products/:id', authMiddleware, productController.deleteProduct);

module.exports = router;