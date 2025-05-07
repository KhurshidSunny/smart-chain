const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const pickingRoutes = require('./routes/pickingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');
require('dotenv').config();


const app = express();

// Middleware
app.use(cors());
app.use(helmet());
// app.use(morgan('combined'));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/picking-lists', pickingRoutes);
app.use('/packages', packageRoutes);
app.use('/qr-codes', qrCodeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Warehouse Service running on port ${PORT}`);
});

module.exports = app;