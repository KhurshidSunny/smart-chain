const Shipment = require('../../models/shipmentModel');
const TrackingEvent = require('../../models/trackingEventModel');
const { publishEvent } = require('../../services/eventService');

const handleOrderPacked = async (payload) => {
    const { orderId, packageId, qrCode, dimensions } = payload;
    const shipment = new Shipment({
        orderId,
        orderNumber: `ORD-${orderId}`,
        packageId,
        qrCode,
        trackingNumber: `TRK-${Date.now()}-${orderId}`,
        carrier: 'DefaultCarrier',
        serviceLevel: 'Standard',
        status: 'Created',
        deliveryAddress: {
            street: 'TBD',
            city: 'TBD',
            state: 'TBD',
            zipCode: 'TBD',
            country: 'TBD'
        },
        cost: 0
    });
    await shipment.save();
    await publishEvent('ShipmentCreated', {
        shipmentId: shipment._id,
        orderId,
        packageId
    });
};

const handleQRCodeScanned = async (payload) => {
    const { code, entityType, entityId, location, scannedBy } = payload;
    if (entityType === 'Shipment') {
        const shipment = await Shipment.findById(entityId);
        if (shipment && shipment.qrCode === code) {
            const newStatus = shipment.status === 'Dispatched' ? 'InTransit' : 'OutForDelivery';
            const trackingEvent = new TrackingEvent({
                shipmentId: entityId,
                status: newStatus,
                location,
                timestamp: new Date()
            });
            await trackingEvent.save();
            shipment.status = newStatus;
            await shipment.save();
            await publishEvent('TrackingUpdated', {
                shipmentId: entityId,
                orderId: shipment.orderId,
                status: newStatus,
                location
            });
        }
    }
};

module.exports = {
    handleOrderPacked,
    handleQRCodeScanned
};