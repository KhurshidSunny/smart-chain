const { selectForecastMethod } = require('./forecastService');
const { calculateReorderSuggestion } = require('./reorderSuggestionService');

function groupHistoryByProduct(historyPoints) {
  const byProduct = new Map();
  for (const point of historyPoints) {
    const current = byProduct.get(point.productId) || [];
    current.push({ date: point.date, quantity: point.quantity });
    byProduct.set(point.productId, current);
  }
  return byProduct;
}

function buildReorderRows(products, historyPoints, options) {
  const historyByProduct = groupHistoryByProduct(historyPoints);
  const data = products.map((product) => {
    const productId = String(product._id);
    const history = historyByProduct.get(productId) || [];
    const forecast = selectForecastMethod(history, options);
    const suggestion = calculateReorderSuggestion({
      stockLevel: product.stockLevel,
      reorderPoint: product.reorderPoint,
      predictedDemand: forecast.predictedDemand,
      averageDailyDemand: forecast.averageDailyDemand,
      horizonDays: options.horizonDays,
    });

    return {
      productId,
      sku: product.sku,
      name: product.name,
      forecastMethod: forecast.forecastMethod,
      evaluation: forecast.evaluation,
      uncertainty: forecast.uncertainty,
      explanation: forecast.explanation,
      ...suggestion,
    };
  });

  data.sort((a, b) => {
    if (a.shouldReorder !== b.shouldReorder) {
      return a.shouldReorder ? -1 : 1;
    }
    return b.suggestedQuantity - a.suggestedQuantity;
  });

  return data;
}

module.exports = { buildReorderRows };
