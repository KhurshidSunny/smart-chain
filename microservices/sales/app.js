const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const orderRoutes = require('./routes/orderRoutes');
const eventHandlerController = require('./controllers/events/eventHandlerController');
const cors = require('cors');


require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',  // Allows any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ().then(() => {
  const eventHandlers = {
    'inventory.reserved': eventHandlerController.handleInventoryReserved,
    'warehouse.order.packed': eventHandlerController.handleOrderPacked,
    'logistics.shipment.dispatched': eventHandlerController.handleShipmentDispatched,
    'logistics.order.delivered': eventHandlerController.handleOrderDelivered,
  };
  subscribeToEvents(eventHandlers);
});

// Routes
app.use('/', orderRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Sales Service running on port ${PORT}`));