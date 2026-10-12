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
          uncertainty: null,
          explanation: 'No demand history yet for this product.',
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
        demandEvents: forecast.demandEvents,
        zeroDayRatio: forecast.zeroDayRatio,
        evaluation: forecast.evaluation,
        uncertainty: forecast.uncertainty,
        explanation: forecast.explanation,
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

    const classicalCandidates = [
      ['moving_average', classical.methods.moving_average.evaluation],
      ['exponential_smoothing', classical.methods.exponential_smoothing.evaluation],
      ['croston', classical.methods.croston.evaluation],
    ];
    let bestClassical = null;
    let bestMae = Infinity;
    for (const [name, evaluation] of classicalCandidates) {
      if (evaluation && evaluation.mae != null && evaluation.mae < bestMae) {
        bestMae = evaluation.mae;
        bestClassical = name;
      }
    }

    res.status(200).json({
      productId,
      sklearnLookupId,
      horizonDays: classical.horizonDays,
      historyDays: classical.historyDays,
      intermittent: classical.intermittent,
      methods: {
        ...classical.methods,
        sklearn_lag_ridge: sklearn,
      },
      summary: {
        bestClassicalByMae: bestClassical,
        selectedLiveMethod: classical.intermittent
          ? 'croston'
          : classical.historyDays >= 7
            ? 'exponential_smoothing'
            : 'moving_average',
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
