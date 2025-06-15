const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    orderNumber: { type: String, required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    trackingNumber: { type: String, unique: true, required: true },
    carrier: { type: String, required: true },
    serviceLevel: { type: String, required: true },
    // Created: The order has been placed and confirmed in the system, but no physical action has started yet
    // Dispatched: The package has left the origin warehouse/fulfillment center and is now in the logistics network
    // InTransit: The package is actively moving through the shipping network between facilities
    // OutForDelivery: The package has reached the local delivery facility and is loaded on a delivery vehicle for final delivery
    // Delivered: The package has been successfully delivered to the recipient or designated location
    status: {
        type: String,
        enum: ['Created', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed'],
        default: 'Created'
    },
    dispatchDate: { type: Date },
    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    deliveryAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    cost: { type: Number, default: 0 },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Shipment', shipmentSchema);