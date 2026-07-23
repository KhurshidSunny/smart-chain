const {
  getDailyDemandHistory,
} = require('../services/demandAggregationService');

exports.getProductDemandHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { from, to } = req.query;

    const history = await getDailyDemandHistory(productId, { from, to });

    res.status(200).json({
      productId,
      data: history,
    });
  } catch (err) {
    if (err.message === 'Invalid productId') {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    console.error('Demand history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
