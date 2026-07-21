require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
require('./middleware/authMiddleware');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(passport.initialize());

connectDB();

app.use('/', healthRoutes);
app.use('/', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
