function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function buildReason({ stockLevel, reorderPoint, predictedDemand, suggestedQuantity }) {
  if (suggestedQuantity <= 0) {
    return 'Stock is enough for the forecasted period';
  }

  if (stockLevel <= reorderPoint) {
    return `Stock is at or below reorder point (${reorderPoint}); forecasted demand is ${predictedDemand}`;
  }

  return `Forecasted demand (${predictedDemand}) exceeds available stock (${stockLevel})`;
}

/**
 * Suggest reorder quantity from current stock, reorder point, and forecasted demand.
 * Target covers forecasted demand and leaves stock at least at the reorder point.
 */
function calculateReorderSuggestion(input = {}) {
  const stockLevel = toNonNegativeNumber(input.stockLevel);
  const reorderPoint = toNonNegativeNumber(input.reorderPoint);
  const predictedDemand = Math.ceil(toNonNegativeNumber(input.predictedDemand));
  const averageDailyDemand = toNonNegativeNumber(input.averageDailyDemand);
  const horizonDays = toNonNegativeNumber(input.horizonDays, 7);

  const targetStock = predictedDemand + reorderPoint;
  const suggestedQuantity = Math.max(0, targetStock - stockLevel);

  return {
    stockLevel,
    reorderPoint,
    predictedDemand,
    averageDailyDemand: Number(averageDailyDemand.toFixed(4)),
    horizonDays,
    targetStock,
    suggestedQuantity,
    shouldReorder: suggestedQuantity > 0,
    reason: buildReason({
      stockLevel,
      reorderPoint,
      predictedDemand,
      suggestedQuantity,
    }),
  };
}

module.exports = {
  calculateReorderSuggestion,
};
