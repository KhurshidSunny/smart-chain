const Shipment = require('../../models/shipmentModel');
const { publishEvent } = require('../../services/eventService');

const handleOrderPacked = async (message) => {
    try {
        const { orderId, packageId, qrCode, dimensions, shippingAddress } = message;
        console.log(message);

        const shipment = new Shipment({
            orderId,
            orderNumber: `ORD-${orderId}`,
            packageId,
            trackingNumber: `TRK-${Date.now()}-${orderId}`,
            carrier: 'DefaultCarrier',
            serviceLevel: 'Standard',
            status: 'created',
            deliveryAddress: shippingAddress,
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