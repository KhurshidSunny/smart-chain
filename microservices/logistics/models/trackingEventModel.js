const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
    status: {
        type: String,
        enum: ['Created', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed'],
        required: true
    },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);