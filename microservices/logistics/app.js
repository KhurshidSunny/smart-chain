const express = require('express');
const connectDB = require('./config/db');
const { connectRabbitMQ, subscribeToEvents } = require('./services/eventService');
const shipmentRoutes = require('./routes/shipmentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
require('dotenv').config();
const cors = require('cors');
const { handleOrderPacked } = require('./controllers/events/eventHandlerController');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allows any origin
}));

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ().then(() => {
    const eventHandlers = {
        'warehouse.order.packed': handleOrderPacked
    };
    subscribeToEvents(eventHandlers);
});

// Routes
app.use('/shipments', shipmentRoutes);
app.use('/tracking', trackingRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Logistics Service running on port ${PORT}`));

module.exports = app;