const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'packed', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      addressId: { type: Schema.Types.ObjectId, required: false },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    qrCode: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'orders' }
);

module.exports = mongoose.model('Order', orderSchema);
