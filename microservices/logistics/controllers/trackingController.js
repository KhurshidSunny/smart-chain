const TrackingEvent = require('../models/trackingEventModel');
const Shipment = require('../models/shipmentModel');
const { publishEvent } = require('../services/eventService');
const validate = require('../middleware/validate');
const Joi = require('joi');

const createTrackingEventSchema = Joi.object({
    shipmentId: Joi.string().required(),
    status: Joi.string().valid('Created', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed').required(),
    location: Joi.string().required(),
    notes: Joi.string().allow('')
});

const getTrackingEvents = async (req, res) => {
    try {
        const trackingEvents = await TrackingEvent.find({ shipmentId: req.params.id });
        res.json(trackingEvents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tracking events', error: error.message });
    }
};

const createTrackingEvent = [
    validate(createTrackingEventSchema),
    async (req, res) => {
        try {
            const { shipmentId, status, location, notes } = req.body;
            const shipment = await Shipment.findById(shipmentId);
            if (!shipment) {
                return res.status(404).json({ message: 'Shipment not found' });
            }
            const trackingEvent = new TrackingEvent({ shipmentId, status, location, notes });
            await trackingEvent.save();
            await publishEvent('TrackingUpdated', {
                shipmentId,
                orderId: shipment.orderId,
                status,
                location
            });
            res.status(201).json(trackingEvent);
        } catch (error) {
            res.status(500).json({ message: 'Error creating tracking event', error: error.message });
        }
    }
];

const getTrackingByNumber = async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber }).populate('orderId packageId');
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        const trackingEvents = await TrackingEvent.find({ shipmentId: shipment._id });
        res.json({ shipment, trackingEvents });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tracking details', error: error.message });
    }
};

module.exports = {
    getTrackingEvents,
    createTrackingEvent,
    getTrackingByNumber
};