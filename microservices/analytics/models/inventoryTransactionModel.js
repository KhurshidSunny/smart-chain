const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventoryTransactionSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      enum: ['received', 'reserved', 'released', 'sold', 'adjusted', 'returned'],
      required: true,
    },
    quantity: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId },
    reason: { type: String },
    performedBy: { type: Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'inventorytransactions' }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
