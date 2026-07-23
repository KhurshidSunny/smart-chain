const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const demandController = require('../controllers/demandController');

const router = express.Router();

router.get('/demand/:productId', authMiddleware, demandController.getProductDemandHistory);

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
