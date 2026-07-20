const mongoose = require('mongoose');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const demoUsers = [
  {
    email: 'admin@smartchain.local',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    roleName: 'admin',
  },
  {
    email: 'customer@smartchain.local',
    password: 'Customer123!',
    firstName: 'Demo',
    lastName: 'Customer',
    roleName: 'customer',
  },
  {
    email: 'inventory@smartchain.local',
    password: 'Inventory123!',
    firstName: 'Inventory',
    lastName: 'Manager',
    roleName: 'inventory_manager',
  },
  {
    email: 'warehouse@smartchain.local',
    password: 'Warehouse123!',
    firstName: 'Warehouse',
    lastName: 'Staff',
    roleName: 'warehouse_staff',
  },
  {
    email: 'sales@smartchain.local',
    password: 'Sales123!',
    firstName: 'Sales',
    lastName: 'Manager',
    roleName: 'sales_manager',
  },
  {
    email: 'logistics@smartchain.local',
    password: 'Logistics123!',
    firstName: 'Logistics',
    lastName: 'Manager',
    roleName: 'logistics_manager',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const item of demoUsers) {
      const role = await Role.findOne({ name: item.roleName });
      if (!role) {
        console.warn(`Role missing: ${item.roleName}. Run npm run init-roles first.`);
        continue;
      }

      const existing = await User.findOne({ email: item.email });
      if (existing) {
        console.log(`Skip existing: ${item.email}`);
        continue;
      }

      const user = new User({
        email: item.email,
        passwordHash: item.password,
        firstName: item.firstName,
        lastName: item.lastName,
        roleId: role._id,
        isActive: true,
      });
      await user.save();
      console.log(`Created: ${item.email} (${item.roleName}) / password: ${item.password}`);
    }

    console.log('Demo users seed complete.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
