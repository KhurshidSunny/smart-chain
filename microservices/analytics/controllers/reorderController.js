const Product = require('../models/productModel');
const { getDailyDemandHistoryForProducts } = require('../services/demandAggregationService');
const {
  selectForecastMethod,
  resolveForecastOptions,
} = require('../services/forecastService');
const { calculateReorderSuggestion } = require('../services/reorderSuggestionService');

function groupHistoryByProduct(historyPoints) {
  const byProduct = new Map();

  for (const point of historyPoints) {
    const current = byProduct.get(point.productId) || [];
    current.push({ date: point.date, quantity: point.quantity });
    byProduct.set(point.productId, current);
  }

  return byProduct;
}

exports.getReorderSuggestions = async (req, res) => {
  try {
    const { from, to, window, horizonDays, alpha } = req.query;
    const options = resolveForecastOptions({ window, horizonDays, alpha });

    const products = await Product.find({})
      .select('_id sku name category stockLevel reorderPoint unitCost active')
      .lean();

    if (products.length === 0) {
      return res.status(200).json({
        horizonDays: options.horizonDays,
        count: 0,
        data: [],
      });
    }

    const productIds = products.map((product) => product._id);
    const historyPoints = await getDailyDemandHistoryForProducts(productIds, { from, to });
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
        category: product.category,
        active: product.active,
        forecastMethod: forecast.method,
        ...suggestion,
      };
    });

    data.sort((a, b) => {
      if (a.shouldReorder !== b.shouldReorder) {
        return a.shouldReorder ? -1 : 1;
      }
      return b.suggestedQuantity - a.suggestedQuantity;
    });

    res.status(200).json({
      horizonDays: options.horizonDays,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('Reorder suggestions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
