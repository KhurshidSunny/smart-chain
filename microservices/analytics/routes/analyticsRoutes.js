const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const demandController = require('../controllers/demandController');
const forecastController = require('../controllers/forecastController');
const reorderController = require('../controllers/reorderController');

const router = express.Router();

router.get('/demand/:productId', authMiddleware, demandController.getProductDemandHistory);

router.get('/forecast/:productId', authMiddleware, forecastController.getProductForecast);

router.get('/reorder', authMiddleware, reorderController.getReorderSuggestions);

router.get('/anomalies', authMiddleware, (req, res) => {
  res.status(200).json({
    data: [],
  });
});

module.exports = router;
