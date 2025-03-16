const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, required: true },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
    }],
    status: {
        type: String,
        enum: ['reserved', 'fulfilled', 'cancelled'], 
        default: 'reserved'
    },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 }, // 24 hours
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);