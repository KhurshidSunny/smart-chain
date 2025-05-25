// microservices/warehouse/app.js
const express = require('express');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const pickingRoutes = require('./routes/pickingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const eventHandlerController = require('./controllers/events/eventHandlerController');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allows any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ().then(() => {
  const eventHandlers = {
    'inventory.reserved': eventHandlerController.eventHandlerController,
    'sales.order.cancelled': eventHandlerController.handleOrderCancelled,
  };
  subscribeToEvents(eventHandlers);
});

// Routes
app.use('/picking-lists', pickingRoutes);
app.use('/packages', packageRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Warehouse Service running on port ${PORT}`));

module.exports = app;