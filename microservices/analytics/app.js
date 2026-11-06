require('dotenv').config();

const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const {
  connectRabbitMQ,
  subscribeToEvents,
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
require('./middleware/authMiddleware');

const app = express();

app.use(securityHeaders);
app.use(corsAllowlist);
app.use(express.json({ limit: jsonBodyLimit() }));
app.use(queryLimits);
app.use(pathLimits);
app.use(passport.initialize());

app.use('/', healthRoutes);
app.use('/', analyticsRoutes);

app.use(apiErrorHandler);

const start = async () => {
  await connectDB();
  startLowStockSchedule();

  const rabbitReady = await connectRabbitMQ();
  if (rabbitReady) {
    subscribeToEvents({
      [ROUTING_LOW_STOCK_PREDICTED]: async (message, envelope) => {
        console.log(
          `[LowStockPredicted] sku=${message.sku} stock=${message.stockLevel} ` +
            `predictedDemand=${message.predictedDemand} horizonDays=${message.horizonDays} ` +
            `correlationId=${envelope.correlationId}`
        );
      },
    });
  }

  const PORT = process.env.PORT || 3006;
  app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
  });
};

start();
