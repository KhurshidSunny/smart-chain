const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    orderNumber: { type: String, required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    trackingNumber: { type: String, unique: true, required: true },
    carrier: { type: String, required: true },
    serviceLevel: { type: String, required: true },
    status: {
        type: String,
        enum: ['Created', 'Dispatched', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed'],
        default: 'Created'
    },
    qrCode: { type: String, required: true },
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