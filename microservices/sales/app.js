const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./services/eventService');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Connect to DB and RabbitMQ
connectDB();
connectRabbitMQ();

// Routes
app.use('/', orderRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Sales Service running on port ${PORT}`));