const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartchain';

  try {
    await mongoose.connect(mongoUri);
    console.log('Analytics Service MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.error('');
    console.error('MongoDB is not reachable at:', mongoUri);
    console.error('Start it first, then restart analytics:');
    console.error('  docker compose up -d mongodb');
    console.error('  OR: cd tools && npm install && npm run mongo');
    console.error('');
    process.exit(1);
  }
};

module.exports = connectDB;
