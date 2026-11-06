const mongoose = require('mongoose');

const lowStockSignalSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  horizonDays: { type: Number, required: true },
  dataVersion: { type: String, required: true },
  state: { type: String, required: true },
  eventId: { type: String },
  emittedAt: { type: Date },
});

lowStockSignalSchema.index({ productId: 1, horizonDays: 1 }, { unique: true });

module.exports = mongoose.models.LowStockSignal || mongoose.model('LowStockSignal', lowStockSignalSchema);
