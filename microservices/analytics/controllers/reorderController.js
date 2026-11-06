const Product = require('../models/productModel');
const { getDailyDemandHistoryForProducts } = require('../services/demandAggregationService');
const { resolveForecastOptions } = require('../services/forecastService');
const { buildReorderRows } = require('../services/reorderQuery');

exports.getReorderSuggestions = async (req, res) => {
  try {
    const { from, to, window, horizonDays, alpha } = req.query;
    const options = resolveForecastOptions({ window, horizonDays, alpha });

    const products = await Product.find({ active: true })
      .select('_id sku name stockLevel reorderPoint')
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
    const data = buildReorderRows(products, historyPoints, options);

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
