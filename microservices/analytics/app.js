require('dotenv').config();

const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const analyticsRoutes = require('./routes/analyticsRoutes');
const {
  connectRabbitMQ,
  subscribeToEvents,
  isRabbitReady,
  ROUTING_LOW_STOCK_PREDICTED,
} = require('./services/eventService');
const { startLowStockSchedule } = require('./services/lowStockSchedule');
const {
  securityHeaders,
  corsAllowlist,
  queryLimits,
  pathLimits,
  jsonBodyLimit,
  apiErrorHandler,
} = require('./sharedLoad');
const { mountObservability, writeLog } = require('./observeLoad');
require('./middleware/authMiddleware');

const app = express();

app.use(securityHeaders);
app.use(corsAllowlist);
app.use(express.json({ limit: jsonBodyLimit() }));
app.use(queryLimits);
app.use(pathLimits);
app.use(passport.initialize());
mountObservability(app, {
  service: 'analytics',
  checks: {
    mongodb: () => mongoose.connection.readyState === 1,
    ...(process.env.RABBITMQ_URL ? { rabbitmq: isRabbitReady } : {}),
  },
});

app.use('/', analyticsRoutes);

app.use(apiErrorHandler);

const start = async () => {
  await connectDB();
  startLowStockSchedule();

  const rabbitReady = await connectRabbitMQ();
  if (rabbitReady) {
    subscribeToEvents({
      [ROUTING_LOW_STOCK_PREDICTED]: async (message, envelope) => {
        writeLog('info', {
          service: 'analytics',
          event: 'low_stock.predicted',
          correlationId: envelope.correlationId,
          eventId: envelope.eventId,
          sku: message.sku,
          outcome: 'ok',
        });
      },
    });
  }

  const PORT = process.env.PORT || 3006;
  app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
  });
};

start();
