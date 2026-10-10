require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const {
  connectRabbitMQ,
  subscribeToEvents,
  ROUTING_LOW_STOCK_PREDICTED,
} = require('./services/eventService');
require('./middleware/authMiddleware');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(passport.initialize());

app.use('/', healthRoutes);
app.use('/', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const start = async () => {
  await connectDB();

  const rabbitReady = await connectRabbitMQ();
  if (rabbitReady) {
    subscribeToEvents({
      [ROUTING_LOW_STOCK_PREDICTED]: async (message) => {
        console.log(
          `[LowStockPredicted] sku=${message.sku} stock=${message.stockLevel} ` +
            `predictedDemand=${message.predictedDemand} horizonDays=${message.horizonDays}`
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
