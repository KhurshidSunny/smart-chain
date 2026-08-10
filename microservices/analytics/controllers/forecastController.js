const { getDailyDemandHistory } = require('../services/demandAggregationService');
const {
  selectForecastMethod,
  resolveForecastOptions,
} = require('../services/forecastService');

exports.getProductForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const { from, to, window, horizonDays, alpha } = req.query;
    const options = resolveForecastOptions({ window, horizonDays, alpha });

    const history = await getDailyDemandHistory(productId, { from, to });
    if (history.length === 0) {
      return res.status(200).json({
        productId,
        data: {
          forecastMethod: null,
          window: options.window,
          alpha: options.alpha,
          horizonDays: options.horizonDays,
          averageDailyDemand: 0,
          predictedDemand: 0,
          pointsUsed: 0,
          evaluation: null,
        },
        history: [],
      });
    }

    const forecast = selectForecastMethod(history, options);

    res.status(200).json({
      productId,
      data: {
        forecastMethod: forecast.forecastMethod,
        window: forecast.window,
        alpha: forecast.alpha,
        horizonDays: forecast.horizonDays,
        averageDailyDemand: forecast.averageDailyDemand,
        predictedDemand: forecast.predictedDemand,
        pointsUsed: forecast.pointsUsed,
        evaluation: forecast.evaluation,
      },
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
