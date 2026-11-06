const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const pickingRoutes = require('./routes/pickingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const { handleInventoryReserved, handleOrderCancelled } = require('./controllers/events/eventHandlerController');
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
      'inventory.reserved': handleInventoryReserved,
      'sales.order.cancelled': handleOrderCancelled
    };
    subscribeToEvents(eventHandlers);
  })
  .catch((err) => {
    console.error('Warehouse RabbitMQ init failed (non-fatal):', err.message);
  });

// Routes
app.use('/picking-lists', pickingRoutes);
app.use('/packages', packageRoutes);

// Error Handling
app.use(apiErrorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Warehouse Service running on port ${PORT}`));

module.exports = app;