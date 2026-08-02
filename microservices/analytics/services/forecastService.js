const FORECAST_HORIZONS = [7, 14, 30];
const DEFAULT_HORIZON_DAYS = 7;
const DEFAULT_SMOOTHING_ALPHA = 0.3;
const SMOOTHING_MIN_POINTS = 7;

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

  if (quantities.length >= SMOOTHING_MIN_POINTS) {
    return forecastWithExponentialSmoothing(history, resolved);
  }

  return forecastWithMovingAverage(history, resolved);
}

module.exports = {
  FORECAST_HORIZONS,
  DEFAULT_HORIZON_DAYS,
  WINDOW_BY_HORIZON,
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  selectForecastMethod,
  resolveForecastOptions,
};
