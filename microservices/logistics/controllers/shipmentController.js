const Shipment = require('../models/shipmentModel');
const TrackingEvent = require('../models/trackingEventModel');
const { publishEvent, commitDomainAndOutbox } = require('../services/eventService');
const validate = require('../middleware/validate');
const Joi = require('joi');

const createShipmentSchema = Joi.object({
    orderId: Joi.string().required(),
    packageId: Joi.string().required(),
    carrier: Joi.string().required(),
    serviceLevel: Joi.string().required(),
    deliveryAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required()
    }).required(),
    notes: Joi.string().allow('')
});

const updateShipmentSchema = Joi.object({
    carrier: Joi.string(),
    serviceLevel: Joi.string(),
    deliveryAddress: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string()
    }),
    notes: Joi.string().allow('')
});

const createShipment = [
    validate(createShipmentSchema),
    async (req, res) => {
        try {
            const { orderId, packageId, carrier, serviceLevel, deliveryAddress, notes } = req.body;
            const trackingNumber = `TRK-${Date.now()}-${orderId}`;
            const qrCode = `QR-${trackingNumber}`;
            const shipment = new Shipment({
                orderId,
                orderNumber: `ORD-${orderId}`,
                packageId,
                trackingNumber,
                carrier,
                serviceLevel,
                qrCode,
                deliveryAddress,
                notes
            });
            await commitDomainAndOutbox(async (session) => {
                await shipment.save({ session });
                await publishEvent('logistics.shipemnt.created', { shipmentId: shipment._id, orderId, packageId }, { session });
            });
            res.status(201).json(shipment);
        } catch (error) {
            res.status(500).json({ message: 'Error creating shipment', error: error.message });
        }
    }
];

const eventLocation = (shipment) => shipment.deliveryAddress?.city || 'Warehouse';

const recordStatusEvent = async (shipment, session) => {
    const trackingEvent = new TrackingEvent({
        shipmentId: shipment._id,
        status: shipment.status,
        location: eventLocation(shipment),
    });
    await trackingEvent.save({ session });
};

const eventsForShipment = async (shipment) => {
    const trackingEvents = await TrackingEvent.find({ shipmentId: shipment._id }).sort({ timestamp: 1 });
    const location = eventLocation(shipment);
    for (const event of trackingEvents) {
        if (event.location === 'N/A') {
            event.location = event.status === 'Delivered' || event.status === 'OutForDelivery' ? location : 'Warehouse';
            await event.save();
        }
    }
    const latest = trackingEvents[trackingEvents.length - 1];
    if (shipment.status && (!latest || latest.status !== shipment.status)) {
        const recorded = await TrackingEvent.create({
            shipmentId: shipment._id,
            status: shipment.status,
            location: shipment.status === 'Delivered' || shipment.status === 'OutForDelivery' ? location : 'Warehouse',
        });
        trackingEvents.push(recorded);
    }
    return trackingEvents;
};

const getShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find().populate('orderId packageId');
        res.json(shipments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shipments', error: error.message });
    }
};

const getShipmentById = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id).populate('orderId packageId');
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        const trackingEvents = await eventsForShipment(shipment);
        res.json({ ...shipment.toObject(), trackingEvents });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shipment', error: error.message });
    }
};

const updateShipmentStatus = [
    validate(Joi.object({ status: Joi.string().valid('Created', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed').required() })),
    async (req, res) => {
        try {
            const shipment = await Shipment.findById(req.params.id);
            if (!shipment) {
                return res.status(404).json({ message: 'Shipment not found' });
            }
            shipment.status = req.body.status;
            if (req.body.status === 'Dispatched') {
                shipment.dispatchDate = new Date();
            } else if (req.body.status === 'Delivered') {
                shipment.actualDeliveryDate = new Date();
            }
            await commitDomainAndOutbox(async (session) => {
                await shipment.save({ session });
                await recordStatusEvent(shipment, session);
                if (req.body.status === 'Dispatched') {
                    await publishEvent('logistics.shipment.dispatched', {
                        shipmentId: shipment._id,
                        orderId: shipment.orderId,
                        dispatchDate: shipment.dispatchDate,
                        trackingNumber: shipment.trackingNumber
                    }, { session });
                } else if (req.body.status === 'Delivered') {
                    await publishEvent('logistics.shipment.delivered', {
                        shipmentId: shipment._id,
                        orderId: shipment.orderId,
                        deliveryDate: shipment.actualDeliveryDate
                    }, { session });
                }
            });
            const trackingEvents = await TrackingEvent.find({ shipmentId: shipment._id }).sort({ timestamp: 1 });
            res.json({ ...shipment.toObject(), trackingEvents });
        } catch (error) {
            res.status(500).json({ message: 'Error updating shipment status', error: error.message });
        }
    }
];

const dispatchShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        if (shipment.status !== 'Created') {
            return res.status(400).json({ message: 'Shipment must be in Created status to dispatch' });
        }
        shipment.status = 'Dispatched';
        shipment.dispatchDate = new Date();
        await commitDomainAndOutbox(async (session) => {
            await shipment.save({ session });
            await publishEvent('logistics.shipment.dispatched', {
                shipmentId: shipment._id,
                orderId: shipment.orderId,
                dispatchDate: shipment.dispatchDate,
                trackingNumber: shipment.trackingNumber
            }, { session });
        });
        res.json(shipment);
    } catch (error) {
        res.status(500).json({ message: 'Error dispatching shipment', error: error.message });
    }
};

const deliverShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        if (shipment.status !== 'OutForDelivery') {
            return res.status(400).json({ message: 'Shipment must be in OutForDelivery status to deliver' });
        }
        shipment.status = 'Delivered';
        shipment.actualDeliveryDate = new Date();
        await commitDomainAndOutbox(async (session) => {
            await shipment.save({ session });
            await publishEvent('logistics.shipment.delivered', {
                shipmentId: shipment._id,
                orderId: shipment.orderId,
                deliveryDate: shipment.actualDeliveryDate
            }, { session });
        });
        res.json(shipment);
    } catch (error) {
        res.status(500).json({ message: 'Error marking shipment as delivered', error: error.message });
    }
};

module.exports = {
    createShipment,
    getShipments,
    getShipmentById,
    updateShipmentStatus,
    dispatchShipment,
    deliverShipment,
    eventsForShipment
};