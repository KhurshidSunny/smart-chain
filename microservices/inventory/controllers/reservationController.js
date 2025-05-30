// reservationController.js
const Product = require('../models/productModel');
const Reservation = require('../models/reservationModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');
const { publishEvent } = require('../services/eventService');

exports.reserveInventory = async (req, res) => {
    try {
        const { orderId, items } = req.body;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || product.stockLevel < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for product ${item.productId}` });
            }
        }

        const reservation = new Reservation({ orderId, items });
        await reservation.save();

        for (const item of items) {
            const product = await Product.findById(item.productId);
            product.stockLevel -= item.quantity;
            await product.save();

            await new InventoryTransaction({
                productId: item.productId,
                type: 'reserved',
                quantity: item.quantity,
                orderId,
                performedBy: req.user.sub,
            }).save();

            if (product.stockLevel <= product.reorderPoint) {
                publishEvent('inventory.low_stock', {
                    productId: product._id,
                    currentLevel: product.stockLevel,
                    reorderPoint: product.reorderPoint,
                });
            }
        }

        publishEvent('inventory.reserved', { orderId, reservationId: reservation._id, items });
        res.status(201).json(reservation);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.releaseInventory = async (req, res) => {
    try {
        const { orderId } = req.body;
        const reservation = await Reservation.findOne({ orderId, status: 'reserved' });
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        for (const item of reservation.items) {
            const product = await Product.findById(item.productId);
            product.stockLevel += item.quantity;
            await product.save();

            await new InventoryTransaction({
                productId: item.productId,
                type: 'released',
                quantity: item.quantity,
                orderId,
                performedBy: req.user.sub,
            }).save();
        }

        reservation.status = 'cancelled';
        await reservation.save();

        publishEvent('inventory.released', { orderId, items: reservation.items });
        res.json({ message: 'Inventory released', reservationId: reservation._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};