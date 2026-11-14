const Shipment = require('../../models/shipmentModel');
const TrackingEvent = require('../../models/trackingEventModel');
const { publishEvent, followFrom, save } = require('../../services/eventService');

const handleOrderPacked = async (message, envelope, session) => {
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
    cost: calculateCost(dimensions),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await save(shipment, session);

  const trkEvt = new TrackingEvent({
    shipmentId: shipment._id,
    status: 'Created',
    location: 'Warehouse',
  });
  await save(trkEvt, session);

  await publishEvent(
    'logistics.shipment.created',
    {
      shipmentId: shipment._id,
      orderId,
      packageId,
    },
    { ...followFrom(envelope), session }
  );
  console.log(`Handled OrderPacked: Created shipment for order ${orderId}`);
};

const calculateCost = (dimensions) => {
  return dimensions ? dimensions.weight * 0.5 : 0;
};

module.exports = { handleOrderPacked };
