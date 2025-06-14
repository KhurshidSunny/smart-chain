// inventoryController.js
const Product = require('../models/productModel');
const { publishEvent } = require('../services/eventService');
const mongoose = require('mongoose');
const InventoryTransactionModel = require('../models/inventoryTransactionModel');
const ReservationModel = require('../models/reservationModel');

/**
 * Get inventory summary for dashboard
 */
exports.getInventorySummary = async (req, res) => {
    try {
        // Get all active products
        const products = await Product.find({ active: true });

        // Calculate summary statistics
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, product) => sum + product.stockLevel, 0);

        // Find low stock products
        const lowStockProducts = products.filter(product =>
            product.stockLevel <= product.reorderPoint
        );
        const lowStockCount = lowStockProducts.length;

        // Prepare data for stock chart (top 10 products by stock level)
        const chartData = products
            .sort((a, b) => b.stockLevel - a.stockLevel)
            .slice(0, 10)
            .map(product => ({
                name: product.name,
                sku: product.sku,
                stockLevel: product.stockLevel,
                reorderPoint: product.reorderPoint
            }));

        res.json({
            totalProducts,
            totalStock,
            lowStockCount,
            products: chartData,
            lowStockProducts: lowStockProducts.map(product => ({
                _id: product._id,
                name: product.name,
                sku: product.sku,
                stockLevel: product.stockLevel,
                reorderPoint: product.reorderPoint
            }))
        });
    } catch (err) {
        console.error('Error fetching inventory summary:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get stock levels for all products with optional filtering
 */
exports.getInventory = async (req, res) => {
    try {
        const { category, lowStock, sku } = req.query;

        // Build filter query
        const filter = { active: true };
        if (category) filter.category = category;
        if (sku) filter.sku = sku;
        if (lowStock === 'true') filter.stockLevel = { $lte: "$reorderPoint" };

        // Get products with inventory data
        const products = await Product.find(filter).select('_id sku name stockLevel reorderPoint');

        res.json({
            count: products.length,
            inventory: products.map(product => ({
                productId: product._id,
                sku: product.sku,
                name: product.name,
                stockLevel: product.stockLevel,
                reorderPoint: product.reorderPoint,
                status: product.stockLevel <= product.reorderPoint ? 'low' : 'normal'
            }))
        });
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get stock level for a specific product
 */
exports.getProductInventory = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.active) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get active reservations for this product
        const activeReservations = await ReservationModel.find({
            'items.productId': productId,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        // Calculate total reserved quantity
        const reservedQuantity = activeReservations.reduce((total, reservation) => {
            const item = reservation.items.find(item =>
                item.productId.toString() === productId.toString());
            return total + (item ? item.quantity : 0);
        }, 0);

        // Get recent transactions
        const recentTransactions = await InventoryTransactionModel.find({ productId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            productId: product._id,
            sku: product.sku,
            name: product.name,
            stockLevel: product.stockLevel,
            availableStock: product.stockLevel - reservedQuantity,
            reservedStock: reservedQuantity,
            reorderPoint: product.reorderPoint,
            status: product.stockLevel <= product.reorderPoint ? 'low' : 'normal',
            recentActivity: recentTransactions.map(tx => ({
                type: tx.type,
                quantity: tx.quantity,
                date: tx.createdAt,
                reason: tx.reason
            }))
        });
    } catch (err) {
        console.error('Error fetching product inventory:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get inventory transactions with filtering and pagination
 */
exports.getInventoryTransactions = async (req, res) => {
    try {
        const { productId, type, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Build filter query
        const filter = {};
        if (productId) filter.productId = productId;
        if (type) filter.type = type;

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Paginate results
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transactions = await InventoryTransactionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('productId', 'sku name');

        const total = await InventoryTransactionModel.countDocuments(filter);

        res.json({
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching inventory transactions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = exports;