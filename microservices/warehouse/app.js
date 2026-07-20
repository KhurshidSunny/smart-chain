const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const pickingRoutes = require('./routes/pickingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const { handleInventoryReserved, handleOrderCancelled } = require('./controllers/events/eventHandlerController');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());
app.use(cors({
  origin: '*', // Allows any origin
}));

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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Warehouse Service running on port ${PORT}`));

module.exports = app;