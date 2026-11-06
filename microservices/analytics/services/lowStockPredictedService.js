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

module.exports = {
  shouldEmitLowStockPredicted,
  buildLowStockPredictedPayload,
};
