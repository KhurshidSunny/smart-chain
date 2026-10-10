const {
  publishEvent,
  ROUTING_LOW_STOCK_PREDICTED,
} = require('./eventService');

/**
 * True when forecasted demand for the horizon exceeds current stock.
 * Advisory signal only — does not create purchase orders.
 */
function shouldEmitLowStockPredicted({ stockLevel, predictedDemand }) {
  const stock = Number(stockLevel);
  const demand = Number(predictedDemand);
  if (!Number.isFinite(stock) || !Number.isFinite(demand)) {
    return false;
  }
  return demand > stock;
}

function buildLowStockPredictedPayload({
  productId,
  sku,
  name,
  stockLevel,
  predictedDemand,
  horizonDays,
  forecastMethod,
  suggestedQuantity,
  reorderPoint,
}) {
  return {
    event: 'LowStockPredicted',
    productId: String(productId),
    sku: sku || null,
    name: name || null,
    stockLevel: Number(stockLevel) || 0,
    predictedDemand: Number(predictedDemand) || 0,
    horizonDays: Number(horizonDays) || 0,
    forecastMethod: forecastMethod || null,
    reorderPoint: Number(reorderPoint) || 0,
    suggestedQuantity: Number(suggestedQuantity) || 0,
    emittedAt: new Date().toISOString(),
  };
}

function publishLowStockPredictedIfNeeded(row) {
  if (
    !shouldEmitLowStockPredicted({
      stockLevel: row.stockLevel,
      predictedDemand: row.predictedDemand,
    })
  ) {
    return false;
  }

  const payload = buildLowStockPredictedPayload(row);
  return publishEvent(ROUTING_LOW_STOCK_PREDICTED, payload);
}

function publishLowStockPredictedBatch(rows) {
  let published = 0;
  for (const row of rows) {
    if (publishLowStockPredictedIfNeeded(row)) {
      published += 1;
    }
  }
  return published;
}

module.exports = {
  shouldEmitLowStockPredicted,
  buildLowStockPredictedPayload,
  publishLowStockPredictedIfNeeded,
  publishLowStockPredictedBatch,
  ROUTING_LOW_STOCK_PREDICTED,
};
