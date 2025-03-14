const mongoose = require('mongoose');
const Role = require('../models/roleModel');
require('dotenv').config();

/**
 * Predefined roles with names, descriptions, and permissions
 * - Based on the Roles and Responsibilities and Comprehensive Role Permissions Matrix
 * - Role names are concise and code-friendly (lowercase, underscores)
 * - Permissions follow a 'resource:action' pattern for RBAC
 */
const predefinedRoles = [
    {
        name: 'admin',
        description: 'Full system control including configuration, user management, and monitoring.',
        permissions: [
            'users:read', 'users:write', // View, create, edit users, manage roles
            'orders:read', 'orders:write', // View all, create, edit, cancel orders
            'inventory:read', 'inventory:write', // View products, create/edit products, adjust inventory
            'warehouse:read', 'warehouse:write', // Full warehouse ops: picking, packing, QR codes
            'logistics:read', 'logistics:write', // Full logistics: shipments, tracking, delivery confirmation
            'feedback:read', 'feedback:write', // View all feedback, respond
            'reports:read', 'reports:write', // View all system, warehouse, sales, logistics reports
        ],
    },
    {
        name: 'warehouse_manager',
        description: 'Oversees warehouse operations, staff, inventory accuracy, and order fulfillment.',
        permissions: [
            'orders:read', // View all orders
            'inventory:read', 'inventory:write', // View stock levels (write for verification?)
            'warehouse:read', 'warehouse:write', // Full access: picking lists, tasks, packing, QR codes
            'logistics:read', // View shipments
            'reports:read', // View warehouse reports
        ],
    },
    {
        name: 'warehouse_staff',
        description: 'Executes picking, packing, QR code attachment, and shipment preparation.',
        permissions: [
            'inventory:read', // View stock levels (read-only)
            'warehouse:read', 'warehouse:write', // View/update picking lists, pack orders, QR codes
        ],
    },
    {
        name: 'inventory_manager',
        description: 'Manages stock levels, product info, audits, and discrepancies.',
        permissions: [
            'orders:read', // View all orders
            'inventory:read', 'inventory:write', // Full access: products, stock adjustments
            'warehouse:read', // Read-only warehouse access
            'reports:read', // Inventory reports
        ],
    },
    {
        name: 'sales_manager',
        description: 'Manages order processing, customer accounts, pricing, and sales performance.',
        permissions: [
            'orders:read', 'orders:write', // View all, create, edit, cancel orders
            'inventory:read', // Read-only inventory access
            'logistics:read', // Read-only logistics access
            'feedback:read', 'feedback:write', // View all feedback, respond
            'reports:read', // Sales reports
        ],
    },
    {
        name: 'logistics_manager',
        description: 'Manages shipping, carriers, tracking, and delivery performance.',
        permissions: [
            'orders:read', // View all orders
            'warehouse:read', // Read-only warehouse access (packages)
            'logistics:read', 'logistics:write', // Full access: shipments, tracking, delivery confirmation
            'reports:read', // Logistics reports
        ],
    },
    {
        name: 'customer_service',
        description: 'Handles customer inquiries, order changes, and feedback.',
        permissions: [
            'orders:read', 'orders:write', // View all, edit, cancel orders
            'warehouse:read', // Read-only warehouse status
            'logistics:read', // Read-only tracking
            'feedback:read', 'feedback:write', // Full feedback access
            'reports:read', // Sales reports (for customer satisfaction metrics)
        ],
    },
    {
        name: 'customer',
        description: 'End-user with self-service capabilities for orders and feedback.',
        permissions: [
            'orders:read', 'orders:write', // View own, create, cancel orders
            'inventory:read', // View products
            'logistics:read', // Track own shipments, confirm deliveries
            'feedback:read', 'feedback:write', // View own, submit feedback
        ],
    },
];

/**
 * Connects to MongoDB using the configured URI
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for role initialization');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        console.error('Ensure MONGO_URI in .env is correct and the database is accessible');
        process.exit(1); // Exit with failure code
    }
};

/**
 * Initializes the Role collection
 * - Upserts roles (inserts if not exists, updates if exists)
 */
const initRoles = async () => {
    try {
        for (const roleData of predefinedRoles) {
            // Use findOneAndUpdate with upsert to avoid duplicates
            const updatedRole = await Role.findOneAndUpdate(
                { name: roleData.name }, // Match by unique name
                {
                    $set: {
                        description: roleData.description,
                        permissions: roleData.permissions,
                        updatedAt: Date.now(),
                    },
                    $setOnInsert: { createdAt: Date.now() }, // Only set createdAt on insert
                },
                { upsert: true, new: true } // Create if not found, return updated doc
            );
            console.log(`Role '${updatedRole.name}' initialized or updated`);
        }
        console.log('Role initialization completed successfully');
    } catch (err) {
        console.error('Error initializing roles:', err.message);
    } finally {
        await mongoose.connection.close(); // Close connection when done
        console.log('MongoDB connection closed');
        process.exit(0); // Exit successfully
    }
};

/**
 * Main function to run the script
 */
const run = async () => {
    await connectDB();
    await initRoles();
};

// Execute the script
run();