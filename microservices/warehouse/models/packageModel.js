const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order' // Reference to Order for QR code lookup
  },
  packagingType: {
    type: String,
    required: true
  },
  dimensions: {
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    depth: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 }
  },
  packedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packedAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

packageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Package', packageSchema);