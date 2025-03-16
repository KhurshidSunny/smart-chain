const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    stockLevel: { type: Number, required: true, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    unitCost: { type: Number, required: true },
    dimensions: {
        width: { type: Number },
        height: { type: Number },
        depth: { type: Number },
        weight: { type: Number },
    },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);