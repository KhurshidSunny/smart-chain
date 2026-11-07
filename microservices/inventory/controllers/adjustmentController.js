// adjustmentController.js
const Product = require('../models/productModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');
const { publishEvent, commitDomainAndOutbox } = require('../services/eventService');

exports.adjustInventory = async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;
        const product = await Product.findById(productId);
        if (!product || !product.active) return res.status(404).json({ message: 'Product not found' });

        const oldStock = product.stockLevel;
        if (product.stockLevel + quantity < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

        await commitDomainAndOutbox(async (session) => {
            product.stockLevel += quantity;
            await product.save({ session });

            await new InventoryTransaction({
                productId,
                type: 'adjusted',
                quantity,
                reason,
                performedBy: req.user.sub,
            }).save({ session });

            if (product.stockLevel <= product.reorderPoint && oldStock > product.reorderPoint) {
                await publishEvent('inventory.low_stock', {
                    productId,
                    currentLevel: product.stockLevel,
                    reorderPoint: product.reorderPoint,
                }, { session });
            }
        });

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await InventoryTransaction.find().populate('productId', 'name sku');
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};