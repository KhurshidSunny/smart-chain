const mongoose = require('mongoose');
const Role = require('../models/roleModel');
require('dotenv').config();

const predefinedRoles = [
    {
        name: 'admin',
        description: 'Full system control including configuration, user management, and monitoring.',
        permissions: [
            'users:read', 'users:write',
            'orders:read', 'orders:write',
            'inventory:read', 'inventory:write',
            'warehouse:read', 'warehouse:write',
            'logistics:read', 'logistics:write',
            'feedback:read', 'feedback:write',
            'reports:read', 'reports:write',
            'addresses:read', 'addresses:write', // Full address management
        ],
    },
    {
        name: 'warehouse_manager',
        description: 'Oversees warehouse operations, staff, inventory accuracy, and order fulfillment.',
        permissions: [
            'orders:read',
            'inventory:read', 'inventory:write',
            'warehouse:read', 'warehouse:write',
            'logistics:read',
            'reports:read',
            'addresses:read', // View customer addresses for shipping
        ],
    },
    {
        name: 'warehouse_staff',
        description: 'Executes picking, packing, QR code attachment, and shipment preparation.',
        permissions: [
            'inventory:read',
            'warehouse:read', 'warehouse:write',
            'addresses:read', // View shipping addresses
        ],
    },
    {
        name: 'inventory_manager',
        description: 'Manages stock levels, product info, audits, and discrepancies.',
        permissions: [
            'orders:read',
            'inventory:read', 'inventory:write',
            'warehouse:read',
            'reports:read',
        ],
    },
    {
        name: 'sales_manager',
        description: 'Manages order processing, customer accounts, pricing, and sales performance.',
        permissions: [
            'orders:read', 'orders:write',
            'inventory:read',
            'logistics:read',
            'feedback:read', 'feedback:write',
            'reports:read',
            'addresses:read', // View customer addresses
        ],
    },
    {
        name: 'logistics_manager',
        description: 'Manages shipping, carriers, tracking, and delivery performance.',
        permissions: [
            'orders:read',
            'warehouse:read',
            'logistics:read', 'logistics:write',
            'reports:read',
            'addresses:read', // View shipping addresses
        ],
    },
    {
        name: 'customer_service',
        description: 'Handles customer inquiries, order changes, and feedback.',
        permissions: [
            'orders:read', 'orders:write',
            'warehouse:read',
            'logistics:read',
            'feedback:read', 'feedback:write',
            'reports:read',
            'addresses:read', // View customer addresses
        ],
    },
    {
        name: 'customer',
        description: 'End-user with self-service capabilities for orders and feedback.',
        permissions: [
            'orders:read', 'orders:write', // Own orders only (enforced in Sales)
            'inventory:read',
            'logistics:read',
            'feedback:read', 'feedback:write',
            'addresses:read', 'addresses:write', // Manage own addresses
        ],
    },
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for role initialization');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const initRoles = async () => {
    try {
        for (const roleData of predefinedRoles) {
            const updatedRole = await Role.findOneAndUpdate(
                { name: roleData.name },
                {
                    $set: {
                        description: roleData.description,
                        permissions: roleData.permissions,
                        updatedAt: Date.now(),
                    },
                    $setOnInsert: { createdAt: Date.now() },
                },
                { upsert: true, new: true }
            );
            console.log(`Role '${updatedRole.name}' initialized or updated`);
        }
        console.log('Role initialization completed successfully');
    } catch (err) {
        console.error('Error initializing roles:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

const run = async () => {
    await connectDB();
    await initRoles();
};

run();