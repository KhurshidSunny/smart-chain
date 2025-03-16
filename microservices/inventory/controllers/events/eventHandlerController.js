const Product = require('../../models/productModel');
const Reservation = require('../../models/reservationModel');
const InventoryTransaction = require('../../models/inventoryTransactionModel');
const { publishEvent } = require('../../services/eventService');

exports.handleOrderCreated = async (message) => {
    try {
        const { orderId, items } = message;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || product.stockLevel < item.quantity) {
                console.error(`Insufficient stock for product ${item.productId} in order ${orderId}`);
                return;
            }
        }

        const reservation = new Reservation({ orderId, items }); // Default 'reserved'
        await reservation.save();

        for (const item of items) {
            const product = await Product.findById(item.productId);
            product.stockLevel -= item.quantity;
            await product.save();

            await new InventoryTransaction({
                productId: item.productId,
                type: 'Reserved',
                quantity: item.quantity,
                orderId,
                performedBy: 'system',
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
        console.log(`Handled OrderCreated for order ${orderId}`);
    } catch (err) {
        console.error('Error handling OrderCreated:', err);
    }
};

exports.handleOrderCancelled = async (message) => {
    try {
        const { orderId } = message;
        const reservation = await Reservation.findOne({ orderId, status: 'reserved' }); // Lowercase
        if (!reservation) return;

        for (const item of reservation.items) {
            const product = await Product.findById(item.productId);
            product.stockLevel += item.quantity;
            await product.save();

            await new InventoryTransaction({
                productId: item.productId,
                type: 'Released',
                quantity: item.quantity,
                orderId,
                performedBy: 'system',
            }).save();
        }

        reservation.status = 'cancelled'; // Lowercase
        await reservation.save();

        publishEvent('inventory.released', { orderId, items: reservation.items });
        console.log(`Handled OrderCancelled for order ${orderId}`);
    } catch (err) {
        console.error('Error handling OrderCancelled:', err);
    }
};

exports.handleOrderPacked = async (message) => {
    try {
        const { orderId } = message;
        const reservation = await Reservation.findOne({ orderId, status: 'reserved' }); // Lowercase
        if (!reservation) return;

        for (const item of reservation.items) {
            await new InventoryTransaction({
                productId: item.productId,
                type: 'Sold',
                quantity: item.quantity,
                orderId,
                performedBy: 'system',
            }).save();
        }

        reservation.status = 'fulfilled'; // Lowercase
        await reservation.save();
        console.log(`Handled OrderPacked for order ${orderId}`);
    } catch (err) {
        console.error('Error handling OrderPacked:', err);
    }
};