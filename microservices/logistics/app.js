const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const shipmentRoutes = require('./routes/shipmentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const { connectRabbitMQ, initSubscriptions } = require('./services/eventService');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB and RabbitMQ
Promise.all([connectDB(), connectRabbitMQ()])
    .then(() => {
        initSubscriptions();
        console.log('Initialized database and message broker');
    })
    .catch((error) => {
        console.error('Startup error:', error);
        process.exit(1);
    });

// Routes
app.use('/shipments', shipmentRoutes);
app.use('/tracking', trackingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Logistics Service running on port ${PORT}`);
});