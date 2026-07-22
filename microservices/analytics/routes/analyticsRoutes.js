const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/forecast', authMiddleware, (req, res) => {
  res.status(200).json({
    data: [],
  });
});

router.get('/reorder', authMiddleware, (req, res) => {
  res.status(200).json({
    data: [],
  });
});

router.get('/anomalies', authMiddleware, (req, res) => {
  res.status(200).json({
    data: [],
  });
});

module.exports = router;
