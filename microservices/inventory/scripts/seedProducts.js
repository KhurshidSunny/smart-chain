const mongoose = require('mongoose');
const Product = require('../models/productModel');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const demoProducts = [
  {
    sku: 'SC-LAP-001',
    name: 'SmartChain Laptop Pro 14',
    description: '14-inch business laptop for warehouse ops',
    category: 'Electronics',
    stockLevel: 45,
    reorderPoint: 10,
    unitCost: 850,
    dimensions: { width: 32, height: 2, depth: 22, weight: 1.4 },
  },
  {
    sku: 'SC-SCN-002',
    name: 'Handheld QR Scanner X2',
    description: 'USB/Bluetooth barcode and QR scanner',
    category: 'Hardware',
    stockLevel: 120,
    reorderPoint: 25,
    unitCost: 65,
    dimensions: { width: 8, height: 15, depth: 6, weight: 0.3 },
  },
  {
    sku: 'SC-BOX-003',
    name: 'Shipping Carton Medium',
    description: 'Medium corrugated shipping box',
    category: 'Packaging',
    stockLevel: 500,
    reorderPoint: 100,
    unitCost: 1.25,
    dimensions: { width: 40, height: 30, depth: 25, weight: 0.4 },
  },
  {
    sku: 'SC-TAG-004',
    name: 'RFID Asset Tag Pack (50)',
    description: 'Pack of 50 passive RFID tags',
    category: 'Tracking',
    stockLevel: 8,
    reorderPoint: 15,
    unitCost: 40,
    dimensions: { width: 10, height: 5, depth: 2, weight: 0.2 },
  },
  {
    sku: 'SC-PLT-005',
    name: 'Warehouse Pallet Jack',
    description: 'Manual hydraulic pallet jack 2500kg',
    category: 'Equipment',
    stockLevel: 12,
    reorderPoint: 3,
    unitCost: 320,
    dimensions: { width: 55, height: 120, depth: 150, weight: 75 },
  },
  {
    sku: 'SC-GLV-006',
    name: 'Safety Gloves (Dozen)',
    description: 'Cut-resistant warehouse gloves, dozen pack',
    category: 'Safety',
    stockLevel: 80,
    reorderPoint: 20,
    unitCost: 18,
    dimensions: { width: 20, height: 10, depth: 15, weight: 0.8 },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const item of demoProducts) {
      const existing = await Product.findOne({ sku: item.sku });
      if (existing) {
        console.log(`Skip existing: ${item.sku}`);
        continue;
      }
      const product = await Product.create(item);
      console.log(`Created: ${product.sku} — ${product.name} (stock ${product.stockLevel})`);
    }

    console.log('Demo products seed complete.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
