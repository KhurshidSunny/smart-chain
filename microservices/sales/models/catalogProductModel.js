const mongoose = require('mongoose');

const catalogProductSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
    unitCost: Number,
    stockLevel: Number,
    active: Boolean,
  },
  { collection: 'products' }
);

module.exports = mongoose.models.CatalogProduct
  || mongoose.model('CatalogProduct', catalogProductSchema);
