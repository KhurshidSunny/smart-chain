const mongoose = require('mongoose');

const pickingListSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order'
  },
  orderNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    picked: {
      type: Number,
      default: 0,
      min: 0
    },
    location: {
      type: String,
      required: true
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
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

pickingListSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PickingList', pickingListSchema);