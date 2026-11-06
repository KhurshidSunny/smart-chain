const Order = require('../models/orderModel');
const {
  flagAnomalousOrderLines,
  DEFAULT_Z_THRESHOLD,
} = require('../services/anomalyService');
const { anomalyScope } = require('../middleware/requestLimits');

function buildDateFilter(from, to) {
  if (!from && !to) {
    return {};
  }

  const createdAt = {};
  if (from) {
    createdAt.$gte = new Date(from);
  }
  if (to) {
    createdAt.$lte = new Date(to);
  }
  return { createdAt };
}

exports.getOrderAnomalies = async (req, res) => {
  try {
    const { from, to, threshold, limit } = req.query;
    const zThreshold = Number(threshold) > 0 ? Number(threshold) : DEFAULT_Z_THRESHOLD;
    const parsedLimit = Number(limit);
    const resultLimit = Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 200)
      : 50;

    const orders = await Order.find({
      status: { $ne: 'cancelled' },
      ...buildDateFilter(from, to),
    })
      .sort({ createdAt: -1 })
      .lean();

    const ownerId = anomalyScope(req.user);
    const visibleOrders = ownerId
      ? orders.filter((order) => String(order.customerId) === ownerId.customerId)
      : orders;

    const data = [];

    for (const order of visibleOrders) {
      const anomalousLines = flagAnomalousOrderLines(order, orders, {
        threshold: zThreshold,
      });

      if (anomalousLines.length === 0) {
        continue;
      }

      data.push({
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        anomalyCount: anomalousLines.length,
        lines: anomalousLines,
      });

      if (data.length >= resultLimit) {
        break;
      }
    }

    res.status(200).json({
      threshold: zThreshold,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('Order anomalies error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
