const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { eventHandlerController } = require('./controllers');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ().then(() => {
    const eventHandlers = {
        'sales.order.created': eventHandlerController.handleOrderCreated,
        'sales.order.cancelled': eventHandlerController.handleOrderCancelled,
        'warehouse.order.packed': eventHandlerController.handleOrderPacked,
    };
    subscribeToEvents(eventHandlers);
});

app.use(cors({
  origin: '*',  // Allows any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/', productRoutes);
app.use('/', inventoryRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Inventory Service running on port ${PORT}`));