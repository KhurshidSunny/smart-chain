const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents, isRabbitReady } = require('./services/eventService');
const orderRoutes = require('./routes/orderRoutes');
const eventHandlerController = require('./controllers/events/eventHandlerController');
require('dotenv').config();
const {
  securityHeaders,
  corsAllowlist,
  queryLimits,
  pathLimits,
  jsonBodyLimit,
  apiErrorHandler,
} = require('./sharedLoad');
const { mountObservability } = require('./observeLoad');

const app = express();

app.use(securityHeaders);
app.use(corsAllowlist);
app.use(express.json({ limit: jsonBodyLimit() }));
app.use(queryLimits);
app.use(pathLimits);
app.use(passport.initialize());
mountObservability(app, {
  service: 'sales',
  checks: {
    mongodb: () => mongoose.connection.readyState === 1,
    ...(process.env.RABBITMQ_URL ? { rabbitmq: isRabbitReady } : {}),
  },
});

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ()
  .then(() => {
    const eventHandlers = {
      'inventory.reserved': eventHandlerController.handleInventoryReserved,
      'warehouse.order.packed': eventHandlerController.handleOrderPacked,
      'logistics.shipment.shipping': eventHandlerController.handleShipmentShipping,
      'logistics.shipment.delivered': eventHandlerController.handleOrderDelivered,
    };
    subscribeToEvents(eventHandlers);
  })
  .catch((err) => {
    console.error('Sales RabbitMQ init failed (non-fatal):', err.message);
  });

// Routes
app.use('/', orderRoutes);

// Error Handling
app.use(apiErrorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Sales Service running on port ${PORT}`));