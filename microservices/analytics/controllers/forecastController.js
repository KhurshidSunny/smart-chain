const { getDailyDemandHistory } = require('../services/demandAggregationService');
const {
  selectForecastMethod,
  resolveForecastOptions,
  compareClassicalForecastMethods,
} = require('../services/forecastService');
const { getSklearnHoldoutForProduct } = require('../services/sklearnHoldoutCache');

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

/**
 * Compare MA vs ES holdout on live history.
 * Sklearn metrics are attached from an offline cache when the productId is present.
 *
 * Optional query: sklearnKey — look up sklearn cache by demo SKU key
 * (e.g. sku-rice-1kg) while classical methods still use :productId history.
 */
exports.compareProductForecastMethods = async (req, res) => {
  try {
    const { productId } = req.params;
    const { from, to, window, horizonDays, alpha, sklearnKey } = req.query;
    const options = resolveForecastOptions({ window, horizonDays, alpha });

    const history = await getDailyDemandHistory(productId, { from, to });
    const classical = compareClassicalForecastMethods(history, options);
    const sklearnLookupId = sklearnKey ? String(sklearnKey) : String(productId);
    const sklearn = getSklearnHoldoutForProduct(sklearnLookupId);

    let bestClassical = null;
    const maEval = classical.methods.moving_average.evaluation;
    const esEval = classical.methods.exponential_smoothing.evaluation;
    if (maEval && esEval) {
      bestClassical =
        maEval.mae <= esEval.mae ? 'moving_average' : 'exponential_smoothing';
    } else if (maEval) {
      bestClassical = 'moving_average';
    } else if (esEval) {
      bestClassical = 'exponential_smoothing';
    }

    res.status(200).json({
      productId,
      sklearnLookupId,
      horizonDays: classical.horizonDays,
      historyDays: classical.historyDays,
      methods: {
        ...classical.methods,
        sklearn_lag_ridge: sklearn,
      },
      summary: {
        bestClassicalByMae: bestClassical,
        sklearnAvailable: Boolean(sklearn.available),
      },
    });
  } catch (err) {
    if (err.message === 'Invalid productId') {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    console.error('Forecast compare error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
