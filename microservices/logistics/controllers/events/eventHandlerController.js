const Shipment = require('../../models/shipmentModel');
const TrackingEvent = require('../../models/trackingEventModel');
const { publishEvent } = require('../../services/eventService');

const handleOrderPacked = async (message) => {
    try {
        const { orderId, packageId, dimensions, shippingAddress } = message;

        const shipment = new Shipment({
            orderId,
            orderNumber: `ORD-${orderId}`,
            packageId,
            trackingNumber: `TRK-${Date.now()}-${orderId}`,
            carrier: 'DefaultCarrier',
            serviceLevel: 'Standard',
            status: 'Created',
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

        // Create tracking event with "Created Status"
        const trkEvt = await new TrackingEvent({
            shipmentId: shipment._id,
            status: 'Created',
            location: 'N/A',
        })

        await trkEvt.save()
    } catch (err) {
        console.error('Error handling OrderPacked:', err);
    }
};

// Placeholder cost calculation (replace with actual logic)
const calculateCost = (dimensions) => {
    return dimensions ? dimensions.weight * 0.5 : 0; // Example calculation
};

module.exports = { handleOrderPacked };