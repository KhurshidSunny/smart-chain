const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles, objectIdParam, pathLimits } = require('../sharedLoad');
const { rejectInvalidAnalyticsQuery } = require('../middleware/requestLimits');
const { STAFF_ANALYTICS_ROLES, ANOMALY_ROLES } = require('../middleware/roles');
const demandController = require('../controllers/demandController');
const forecastController = require('../controllers/forecastController');
const reorderController = require('../controllers/reorderController');
const anomalyController = require('../controllers/anomalyController');

const router = express.Router();
const staffAnalytics = requireRoles(STAFF_ANALYTICS_ROLES);
const anomalyReaders = requireRoles(ANOMALY_ROLES);

router.get(
  '/demand/:productId',
  authMiddleware,
  staffAnalytics,
  pathLimits,
  objectIdParam('productId'),
  rejectInvalidAnalyticsQuery,
  demandController.getProductDemandHistory
);

router.get(
  '/forecast/:productId/compare',
  authMiddleware,
  staffAnalytics,
  pathLimits,
  objectIdParam('productId'),
  rejectInvalidAnalyticsQuery,
  forecastController.compareProductForecastMethods
);

router.get(
  '/forecast/:productId',
  authMiddleware,
  staffAnalytics,
  pathLimits,
  objectIdParam('productId'),
  rejectInvalidAnalyticsQuery,
  forecastController.getProductForecast
);

router.get(
  '/reorder',
  authMiddleware,
  staffAnalytics,
  rejectInvalidAnalyticsQuery,
  reorderController.getReorderSuggestions
);

router.get(
  '/anomalies',
  authMiddleware,
  anomalyReaders,
  rejectInvalidAnalyticsQuery,
  anomalyController.getOrderAnomalies
);

module.exports = router;
