const DEFAULT_WINDOW = 7;
const DEFAULT_HORIZON_DAYS = 7;
const DEFAULT_SMOOTHING_ALPHA = 0.35;
const SMOOTHING_MIN_POINTS = 10;

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

function forecastWithMovingAverage(history, options = {}) {
  const window = toPositiveNumber(options.window, DEFAULT_WINDOW);
  const horizonDays = toPositiveNumber(options.horizonDays, DEFAULT_HORIZON_DAYS);
  const quantities = extractQuantities(history);

  if (quantities.length === 0) {
    return {
      method: 'moving_average',
      window,
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
    method: 'moving_average',
    window,
    horizonDays,
    averageDailyDemand: Number(averageDailyDemand.toFixed(4)),
    predictedDemand: Number(predictedDemand.toFixed(4)),
    pointsUsed: sample.length,
  };
}

function forecastWithExponentialSmoothing(history, options = {}) {
  const alpha = toPositiveNumber(options.alpha, DEFAULT_SMOOTHING_ALPHA);
  const horizonDays = toPositiveNumber(options.horizonDays, DEFAULT_HORIZON_DAYS);
  const quantities = extractQuantities(history);

  if (quantities.length === 0) {
    return {
      method: 'exponential_smoothing',
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
    method: 'exponential_smoothing',
    alpha,
    horizonDays,
    averageDailyDemand: Number(smoothed.toFixed(4)),
    predictedDemand: Number((smoothed * horizonDays).toFixed(4)),
    pointsUsed: quantities.length,
  };
}

function selectForecastMethod(history, options = {}) {
  const quantities = extractQuantities(history);
  if (quantities.length >= SMOOTHING_MIN_POINTS) {
    return forecastWithExponentialSmoothing(history, options);
  }
  return forecastWithMovingAverage(history, options);
}

module.exports = {
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  selectForecastMethod,
};
