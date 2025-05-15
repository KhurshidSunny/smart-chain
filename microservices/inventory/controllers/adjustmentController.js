const Product = require('../models/productModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');
const { publishEvent } = require('../services/eventService');

exports.adjustInventory = async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;
        const product = await Product.findById(productId);
        if (!product || !product.active) return res.status(404).json({ message: 'Product not found' });

        const oldStock = product.stockLevel;
        product.stockLevel += quantity;
        if (product.stockLevel < 0) return res.status(400).json({ message: 'Stock cannot be negative' });
        await product.save();

        await new InventoryTransaction({
            productId,
            type: 'adjusted',
            quantity,
            reason,
            performedBy: req.user.sub,
        }).save();

        if (product.stockLevel <= product.reorderPoint && oldStock > product.reorderPoint) {
            publishEvent('inventory.low_stock', {
                productId,
                currentLevel: product.stockLevel,
                reorderPoint: product.reorderPoint,
            });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        console.log('transactions')
        const transactions = await InventoryTransaction.find().populate('productId', 'name sku');
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};