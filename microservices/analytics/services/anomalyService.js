const DEFAULT_Z_THRESHOLD = 2.5;
const MIN_HISTORY_POINTS = 3;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mean(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values, average) {
  if (values.length < 2) {
    return 0;
  }

  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

function severityFromZScore(absoluteZ, threshold) {
  if (absoluteZ >= threshold + 1) {
    return 'high';
  }
  if (absoluteZ >= threshold) {
    return 'medium';
  }
  return 'none';
}

function buildAnomalyReason({ quantity, mean, zScore, severity, standardDeviation }) {
  if (severity === 'none') {
    return null;
  }

  if (standardDeviation === 0) {
    if (quantity > mean) {
      return `Quantity (${quantity}) differs from the usual fixed amount (${mean})`;
    }
    return `Quantity (${quantity}) is below the usual fixed amount (${mean})`;
  }

  if (zScore > 0) {
    if (severity === 'high') {
      return `Quantity (${quantity}) is much higher than average (${mean})`;
    }
    return `Quantity (${quantity}) is higher than average (${mean})`;
  }

  if (severity === 'high') {
    return `Quantity (${quantity}) is much lower than average (${mean})`;
  }
  return `Quantity (${quantity}) is lower than average (${mean})`;
}

/**
 * Compare one quantity against a product's historical order-line quantities.
 */
function evaluateQuantityAnomaly(quantity, historicalQuantities, options = {}) {
  const value = toNumber(quantity);
  const history = (historicalQuantities || [])
    .map((item) => toNumber(item))
    .filter((item) => item >= 0);

  const threshold = toNumber(options.threshold, DEFAULT_Z_THRESHOLD);
  const minHistory = toNumber(options.minHistory, MIN_HISTORY_POINTS);

  if (history.length < minHistory) {
    return {
      isAnomaly: false,
      zScore: null,
      mean: history.length ? Number(mean(history).toFixed(4)) : null,
      standardDeviation: null,
      severity: 'none',
      pointsUsed: history.length,
      quantity: value,
      reason: null,
    };
  }

  const avg = mean(history);
  const stdDev = standardDeviation(history, avg);

  if (stdDev === 0) {
    const isAnomaly = value !== avg;
    const severity = isAnomaly ? 'medium' : 'none';
    return {
      isAnomaly,
      zScore: isAnomaly ? null : 0,
      mean: Number(avg.toFixed(4)),
      standardDeviation: 0,
      severity,
      pointsUsed: history.length,
      quantity: value,
      reason: buildAnomalyReason({
        quantity: value,
        mean: Number(avg.toFixed(4)),
        zScore: value > avg ? 1 : -1,
        severity,
        standardDeviation: 0,
      }),
    };
  }

  const zScore = (value - avg) / stdDev;
  const absoluteZ = Math.abs(zScore);
  const severity = severityFromZScore(absoluteZ, threshold);
  const isAnomaly = severity !== 'none';
  const roundedMean = Number(avg.toFixed(4));
  const roundedZ = Number(zScore.toFixed(4));

  return {
    isAnomaly,
    zScore: roundedZ,
    mean: roundedMean,
    standardDeviation: Number(stdDev.toFixed(4)),
    severity,
    pointsUsed: history.length,
    quantity: value,
    reason: buildAnomalyReason({
      quantity: value,
      mean: roundedMean,
      zScore: roundedZ,
      severity,
      standardDeviation: stdDev,
    }),
  };
}

function buildHistoryByProduct(orders, excludeOrderId) {
  const historyByProduct = new Map();

  for (const order of orders) {
    if (excludeOrderId && String(order._id) === String(excludeOrderId)) {
      continue;
    }

    for (const item of order.items || []) {
      const productId = String(item.productId);
      const current = historyByProduct.get(productId) || [];
      current.push(toNumber(item.quantity));
      historyByProduct.set(productId, current);
    }
  }

  return historyByProduct;
}

/**
 * Flag unusual line quantities on an order using product quantity history.
 */
function flagAnomalousOrderLines(order, allOrders, options = {}) {
  const historyByProduct = buildHistoryByProduct(allOrders, order._id);
  const anomalies = [];

  for (const item of order.items || []) {
    const productId = String(item.productId);
    const history = historyByProduct.get(productId) || [];
    const evaluation = evaluateQuantityAnomaly(item.quantity, history, options);

    if (!evaluation.isAnomaly) {
      continue;
    }

    anomalies.push({
      productId,
      productName: item.name,
      unitPrice: item.unitPrice,
      ...evaluation,
    });
  }

  return anomalies;
}

module.exports = {
  DEFAULT_Z_THRESHOLD,
  MIN_HISTORY_POINTS,
  evaluateQuantityAnomaly,
  flagAnomalousOrderLines,
  buildHistoryByProduct,
};
