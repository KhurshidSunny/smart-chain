// app.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents, isRabbitReady } = require('./services/eventService');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { eventHandlerController } = require('./controllers');
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
  service: 'inventory',
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
            'sales.order.created': eventHandlerController.handleOrderCreated,
            'sales.order.cancelled': eventHandlerController.handleOrderCancelled,
            'warehouse.order.packed': eventHandlerController.handleOrderPacked,
        };
        subscribeToEvents(eventHandlers);
    })
    .catch((err) => {
        console.error('Inventory RabbitMQ init failed (non-fatal):', err.message);
    });

app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);

// Error Handling
app.use(apiErrorHandler);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Inventory Service running on port ${PORT}`));