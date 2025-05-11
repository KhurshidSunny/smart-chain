const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json()); // Parse JSON bodies

// Allow CORS for all origins
app.use(cors({
    origin: true, // Allows all origins
    credentials: true // If you need to support credentials (e.g., cookies, auth headers)
}));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes); // Authentication endpoints
app.use('/users', userRoutes); // User management endpoints
app.use('/welcome', (req, res) => { res.send('Welcome to IAM service!') });

const PORT = process.env.PORT || 3001; // Fallback port for local dev
app.listen(PORT, () => console.log(`IAM service running on port ${PORT}`));