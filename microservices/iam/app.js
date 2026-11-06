
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();
const {
  securityHeaders,
  corsAllowlist,
  queryLimits,
  pathLimits,
  jsonBodyLimit,
  apiErrorHandler,
} = require('./sharedLoad');

const app = express();

app.use(securityHeaders);
app.use(corsAllowlist);
app.use(express.json({ limit: jsonBodyLimit() }));
app.use(queryLimits);
app.use(pathLimits);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes); // Authentication endpoints
app.use('/users', userRoutes); // User management endpoints
app.use('/welcome', (req, res) => { res.send('Welcome to IAM service!') });
app.use(apiErrorHandler);

const PORT = process.env.PORT || 3001; // Fallback port for local dev
app.listen(PORT, () => console.log(`IAM service running on port ${PORT}`));