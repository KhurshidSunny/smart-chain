const Order = require('../../models/orderModel');
const { publishEvent } = require('../../services/eventService');
const QRCode = require('qrcode'); // Import QRCode library

exports.publishOrderCreated = async (order) => {
    try {
        publishEvent('sales.order.created', {
            orderId: order._id,
            customerId: order.customerId,
            items: order.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        });
        console.log(`Published OrderCreated for order ${order._id}`);
    } catch (error) {
        console.error('Error publishing OrderCreated:', error);
    }
};

// Subscription Handlers
exports.handleInventoryReserved = async (message) => {
    try {
        const { orderId } = message;
        const order = await Order.findById(orderId);
        if (!order) return console.warn(`Order ${orderId} not found`);

        // Generate QR code with orderId
        const qrCodeData = await QRCode.toString(order._id.toString(), { type: 'utf8' });
        order.qrCode = qrCodeData; 
        console.log(`QR code generated for order ${order.qrCode}`);


        // Update order status
        order.status = 'confirmed';
        order.updatedAt = Date.now();
        await order.save();
        console.log(`Order ${orderId} status updated to Confirmed`);
    } catch (error) {
        console.error('Error handling InventoryReserved:', error);
    }
};

exports.handleOrderPacked = async (message) => {
    try {
        const { orderId } = message;
        const order = await Order.findById(orderId);
        if (!order) return console.warn(`Order ${orderId} not found`);

        order.status = 'packed';
        order.updatedAt = Date.now();
        await order.save();
        console.log(`Order ${orderId} status updated to Packed`);
    } catch (error) {
        console.error('Error handling OrderPacked:', error);
    }
};

exports.handleShipmentDispatched = async (message) => {
    try {
        const { orderId } = message;
        const order = await Order.findById(orderId);
        if (!order) return console.warn(`Order ${orderId} not found`);

        order.status = 'shipped';
        order.updatedAt = Date.now();
        await order.save();
        console.log(`Order ${orderId} status updated to Shipped`);
    } catch (error) {
        console.error('Error handling ShipmentDispatched:', error);
    }
};

exports.handleOrderDelivered = async (message) => {
    try {
        const { orderId } = message;
        const order = await Order.findById(orderId);
        if (!order) return console.warn(`Order ${orderId} not found`);

        order.status = 'delivered';
        order.updatedAt = Date.now();
        await order.save();
        // TODO: Trigger customer notification (e.g., via a notification service)
        console.log(`Order ${orderId} status updated to Delivered - Notification pending`);
    } catch (error) {
        console.error('Error handling OrderDelivered:', error);
    }
};