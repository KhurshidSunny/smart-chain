const FORECAST_HORIZONS = [7, 14, 30];
const DEFAULT_HORIZON_DAYS = 7;
const DEFAULT_SMOOTHING_ALPHA = 0.3;
const SMOOTHING_MIN_POINTS = 7;
const EVAL_MIN_HISTORY_POINTS = 4;
const EVAL_MAX_HOLDOUT_DAYS = 3;

// Lookback windows sized for sparse demo catalog history
const WINDOW_BY_HORIZON = {
  7: 7,
  14: 14,
  30: 21,
};

function extractQuantities(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }
  return history.map((point) => Number(point.quantity) || 0);
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nearestHorizon(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HORIZON_DAYS;
  }

  return FORECAST_HORIZONS.reduce((best, current) => {
    const bestDistance = Math.abs(best - parsed);
    const currentDistance = Math.abs(current - parsed);
    return currentDistance < bestDistance ? current : best;
  }, FORECAST_HORIZONS[0]);
}

function resolveForecastOptions(options = {}) {
  const horizonDays = nearestHorizon(options.horizonDays);
  const window = toPositiveNumber(options.window, WINDOW_BY_HORIZON[horizonDays]);
  const alpha = toPositiveNumber(options.alpha, DEFAULT_SMOOTHING_ALPHA);

  return { horizonDays, window, alpha };
}

function meanAbsoluteError(actuals, predictions) {
  if (!actuals.length || actuals.length !== predictions.length) {
    return null;
  }

  const total = actuals.reduce((sum, actual, index) => {
    return sum + Math.abs(actual - predictions[index]);
  }, 0);

  return total / actuals.length;
}

function meanAbsolutePercentageError(actuals, predictions) {
  if (!actuals.length || actuals.length !== predictions.length) {
    return null;
  }

  let counted = 0;
  let total = 0;

  for (let index = 0; index < actuals.length; index += 1) {
    const actual = actuals[index];
    if (actual === 0) {
      continue;
    }
    total += Math.abs(actual - predictions[index]) / actual;
    counted += 1;
  }

  if (counted === 0) {
    return null;
  }

  return (total / counted) * 100;
}

function predictNextDailyDemand(trainHistory, options = {}) {
  const resolved = resolveForecastOptions(options);
  const quantities = extractQuantities(trainHistory);

  if (quantities.length === 0) {
    return 0;
  }

  if (quantities.length >= SMOOTHING_MIN_POINTS) {
    let smoothed = quantities[0];
    for (let index = 1; index < quantities.length; index += 1) {
      smoothed = resolved.alpha * quantities[index] + (1 - resolved.alpha) * smoothed;
    }
    return smoothed;
  }

  const sample = quantities.slice(-resolved.window);
  return average(sample);
}

/**
 * Hold out the most recent days, refit on earlier history, and score one-step daily errors.
 * Returns null when history is too short for a meaningful holdout.
 */
function evaluateForecastHoldout(history, options = {}) {
  const quantities = extractQuantities(history);

  if (quantities.length < EVAL_MIN_HISTORY_POINTS) {
    return null;
  }

  const holdoutDays = Math.min(
    EVAL_MAX_HOLDOUT_DAYS,
    Math.max(1, Math.floor(quantities.length / 4))
  );
  const trainEnd = quantities.length - holdoutDays;

  if (trainEnd < 1) {
    return null;
  }

  const actuals = [];
  const predictions = [];

  for (let index = trainEnd; index < quantities.length; index += 1) {
    const trainHistory = history.slice(0, index);
    const predictedDaily = predictNextDailyDemand(trainHistory, options);
    actuals.push(quantities[index]);
    predictions.push(predictedDaily);
  }

  const mae = meanAbsoluteError(actuals, predictions);
  const mape = meanAbsolutePercentageError(actuals, predictions);

  return {
    holdoutDays,
    pointsEvaluated: actuals.length,
    mae: mae === null ? null : Number(mae.toFixed(4)),
    mape: mape === null ? null : Number(mape.toFixed(2)),
  };
}

function forecastWithMovingAverage(history, options = {}) {
  const { window, horizonDays } = resolveForecastOptions(options);
  const quantities = extractQuantities(history);

  if (quantities.length === 0) {
    return {
      forecastMethod: 'moving_average',
      window,
      alpha: null,
      horizonDays,
      averageDailyDemand: 0,
      predictedDemand: 0,
      pointsUsed: 0,
    };
  }

  const sample = quantities.slice(-window);
  const averageDailyDemand = average(sample);
  const predictedDemand = averageDailyDemand * horizonDays;

  return {
    forecastMethod: 'moving_average',
    window,
    alpha: null,
    horizonDays,
    averageDailyDemand: Number(averageDailyDemand.toFixed(4)),
    predictedDemand: Number(predictedDemand.toFixed(4)),
    pointsUsed: sample.length,
  };
}

function forecastWithExponentialSmoothing(history, options = {}) {
  const { alpha, horizonDays } = resolveForecastOptions(options);
  const quantities = extractQuantities(history);

  if (quantities.length === 0) {
    return {
      forecastMethod: 'exponential_smoothing',
      window: null,
      alpha,
      horizonDays,
      averageDailyDemand: 0,
      predictedDemand: 0,
      pointsUsed: 0,
    };
  }

  let smoothed = quantities[0];
  for (let index = 1; index < quantities.length; index += 1) {
    smoothed = alpha * quantities[index] + (1 - alpha) * smoothed;
  }

  return {
    forecastMethod: 'exponential_smoothing',
    window: null,
    alpha,
    horizonDays,
    averageDailyDemand: Number(smoothed.toFixed(4)),
    predictedDemand: Number((smoothed * horizonDays).toFixed(4)),
    pointsUsed: quantities.length,
  };
}

function selectForecastMethod(history, options = {}) {
  const resolved = resolveForecastOptions(options);
  const quantities = extractQuantities(history);

  const forecast =
    quantities.length >= SMOOTHING_MIN_POINTS
      ? forecastWithExponentialSmoothing(history, resolved)
      : forecastWithMovingAverage(history, resolved);

  return {
    ...forecast,
    evaluation: evaluateForecastHoldout(history, resolved),
  };
}

module.exports = {
  FORECAST_HORIZONS,
  DEFAULT_HORIZON_DAYS,
  WINDOW_BY_HORIZON,
  EVAL_MIN_HISTORY_POINTS,
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  selectForecastMethod,
  resolveForecastOptions,
  evaluateForecastHoldout,
  meanAbsoluteError,
  meanAbsolutePercentageError,
};
