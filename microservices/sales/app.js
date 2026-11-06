const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
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

const app = express();

app.use(securityHeaders);
app.use(corsAllowlist);
app.use(express.json({ limit: jsonBodyLimit() }));
app.use(queryLimits);
app.use(pathLimits);
app.use(passport.initialize());

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