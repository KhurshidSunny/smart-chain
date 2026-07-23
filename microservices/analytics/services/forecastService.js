const DEFAULT_WINDOW = 7;

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

/**
 * Simple moving-average forecast from a daily demand series.
 * Uses the last `window` points (or all points if fewer are available).
 */
function forecastWithMovingAverage(history, options = {}) {
  const window = Number(options.window) > 0 ? Number(options.window) : DEFAULT_WINDOW;
  const horizonDays = Number(options.horizonDays) > 0 ? Number(options.horizonDays) : window;
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

module.exports = {
  forecastWithMovingAverage,
};
