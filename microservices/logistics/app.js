const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents, isRabbitReady } = require('./services/eventService');
const shipmentRoutes = require('./routes/shipmentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
require('dotenv').config();
const { handleOrderPacked } = require('./controllers/events/eventHandlerController');
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
mountObservability(app, {
  service: 'logistics',
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
            'warehouse.order.packed': handleOrderPacked
        };
        subscribeToEvents(eventHandlers);
    })
    .catch((err) => {
        console.error('Logistics RabbitMQ init failed (non-fatal):', err.message);
    });

// Routes
app.use('/shipments', shipmentRoutes);
app.use('/tracking', trackingRoutes);

// Error Handling
app.use(apiErrorHandler);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Logistics Service running on port ${PORT}`));

module.exports = app;