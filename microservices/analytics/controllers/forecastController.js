const { getDailyDemandHistory } = require('../services/demandAggregationService');
const { selectForecastMethod } = require('../services/forecastService');

exports.getProductForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const { from, to, window, horizonDays, alpha } = req.query;

    const history = await getDailyDemandHistory(productId, { from, to });
    if (history.length === 0) {
      return res.status(200).json({
        productId,
        data: {
          method: null,
          averageDailyDemand: 0,
          predictedDemand: 0,
          pointsUsed: 0,
          horizonDays: Number(horizonDays) || 7,
        },
        history: [],
      });
    }

    const forecast = selectForecastMethod(history, {
      window,
      horizonDays,
      alpha,
    });

    res.status(200).json({
      productId,
      data: forecast,
      history,
    });
  } catch (err) {
    if (err.message === 'Invalid productId') {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    console.error('Forecast error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
