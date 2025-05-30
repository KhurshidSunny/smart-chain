const Shipment = require('../../models/shipmentModel');
const Order = require('../../models/orderModel'); // Assuming orderModel.js exists for lookup
const { publishEvent } = require('../../services/eventService');

exports.handleOrderPacked = async (message) => {
    try {
        const { orderId, packageId, qrCode, dimensions } = message;

        // Fetch order to get shipping address
        const order = await Order.findById(orderId);
        if (!order) {
            console.error(`Order ${orderId} not found`);
            return;
        }

        const shipment = new Shipment({
            orderId,
            orderNumber: `ORD-${orderId}`,
            packageId,
            trackingNumber: `TRK-${Date.now()}-${orderId}`,
            carrier: 'DefaultCarrier',
            serviceLevel: 'Standard',
            status: 'created',
            deliveryAddress: {
                street: order.shippingAddress.street,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                country: order.shippingAddress.country
            },
            cost: calculateCost(dimensions), // Placeholder function
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await shipment.save();
        console.log(`Handled OrderPacked: Created shipment for order ${orderId}`);

        await publishEvent('logistics.shipment.created', {
            shipmentId: shipment._id,
            orderId,
            packageId
        });
    } catch (err) {
        console.error('Error handling OrderPacked:', err);
    }
};

// Placeholder cost calculation (replace with actual logic)
const calculateCost = (dimensions) => {
    return dimensions ? dimensions.weight * 0.5 : 0; // Example calculation
};

module.exports = { handleOrderPacked };