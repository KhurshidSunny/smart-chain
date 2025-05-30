// productController.js
const Product = require('../models/productModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');
const { publishEvent } = require('../services/eventService');

exports.createProduct = async (req, res) => {
  try {
    const { sku, name, description, category, stockLevel, reorderPoint, unitCost, dimensions } = req.body;
    const product = new Product({
      sku,
      name,
      description,
      category,
      stockLevel,
      reorderPoint,
      unitCost,
      dimensions,
    });
    await product.save();

    await new InventoryTransaction({
      productId: product._id,
      type: 'received',
      quantity: stockLevel,
      performedBy: req.user.sub,
      reason: 'Initial stock addition',
    }).save();

    if (stockLevel <= reorderPoint) {
      publishEvent('inventory.low_stock', { productId: product._id, currentLevel: stockLevel, reorderPoint });
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) return res.status(404).json({ message: 'Product not found' });

    console.log('updating product')
    Object.assign(product, req.body, { updatedAt: Date.now() });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) return res.status(404).json({ message: 'Product not found' });

    product.active = false;
    product.updatedAt = Date.now();
    await product.save();
    res.json({ message: 'Product deactivated', id: product._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};