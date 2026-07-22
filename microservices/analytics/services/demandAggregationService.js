const mongoose = require('mongoose');
const Order = require('../models/orderModel');

const CANCELLED_STATUS = 'cancelled';

function toObjectId(productId) {
  if (productId instanceof mongoose.Types.ObjectId) {
    return productId;
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid productId');
  }
  return new mongoose.Types.ObjectId(productId);
}

function buildDateMatch(from, to) {
  const createdAt = {};
  if (from) {
    createdAt.$gte = new Date(from);
  }
  if (to) {
    createdAt.$lte = new Date(to);
  }
  return Object.keys(createdAt).length > 0 ? { createdAt } : {};
}

/**
 * Aggregate order line quantities into daily demand for one product.
 * Cancelled orders are excluded.
 *
 * @param {string|mongoose.Types.ObjectId} productId
 * @param {{ from?: Date|string, to?: Date|string }} [options]
 * @returns {Promise<Array<{ date: string, quantity: number }>>}
 */
async function getDailyDemandFromOrders(productId, options = {}) {
  const productObjectId = toObjectId(productId);
  const { from, to } = options;

  const pipeline = [
    {
      $match: {
        status: { $ne: CANCELLED_STATUS },
        'items.productId': productObjectId,
        ...buildDateMatch(from, to),
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.productId': productObjectId,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        quantity: { $sum: '$items.quantity' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        quantity: 1,
      },
    },
    { $sort: { date: 1 } },
  ];

  return Order.aggregate(pipeline);
}

/**
 * Aggregate daily demand for several products in one pass.
 *
 * @param {Array<string|mongoose.Types.ObjectId>} productIds
 * @param {{ from?: Date|string, to?: Date|string }} [options]
 * @returns {Promise<Array<{ productId: string, date: string, quantity: number }>>}
 */
async function getDailyDemandFromOrdersForProducts(productIds, options = {}) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  const productObjectIds = productIds.map(toObjectId);
  const { from, to } = options;

  const pipeline = [
    {
      $match: {
        status: { $ne: CANCELLED_STATUS },
        'items.productId': { $in: productObjectIds },
        ...buildDateMatch(from, to),
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.productId': { $in: productObjectIds },
      },
    },
    {
      $group: {
        _id: {
          productId: '$items.productId',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
        },
        quantity: { $sum: '$items.quantity' },
      },
    },
    {
      $project: {
        _id: 0,
        productId: { $toString: '$_id.productId' },
        date: '$_id.date',
        quantity: 1,
      },
    },
    { $sort: { productId: 1, date: 1 } },
  ];

  return Order.aggregate(pipeline);
}

module.exports = {
  getDailyDemandFromOrders,
  getDailyDemandFromOrdersForProducts,
};
