const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/', healthRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
