const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');

const CANCELLED_STATUS = 'cancelled';
const DEMAND_TRANSACTION_TYPES = ['sold', 'reserved'];

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

function mergeDailySeries(seriesList) {
  const byDate = new Map();

  for (const series of seriesList) {
    for (const point of series) {
      const current = byDate.get(point.date) || 0;
      byDate.set(point.date, Math.max(current, point.quantity));
    }
  }

  return Array.from(byDate.entries())
    .map(([date, quantity]) => ({ date, quantity }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mergeMultiProductSeries(seriesList) {
  const byKey = new Map();

  for (const series of seriesList) {
    for (const point of series) {
      const key = `${point.productId}|${point.date}`;
      const current = byKey.get(key);
      if (!current || point.quantity > current.quantity) {
        byKey.set(key, {
          productId: point.productId,
          date: point.date,
          quantity: point.quantity,
        });
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.productId === b.productId) {
      return a.date.localeCompare(b.date);
    }
    return a.productId.localeCompare(b.productId);
  });
}

/**
 * Aggregate order line quantities into daily demand for one product.
 * Cancelled orders are excluded.
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
 * Aggregate outbound inventory activity into daily demand for one product.
 * Uses sold and reserved transactions.
 */
async function getDailyDemandFromInventory(productId, options = {}) {
  const productObjectId = toObjectId(productId);
  const { from, to } = options;

  const pipeline = [
    {
      $match: {
        productId: productObjectId,
        type: { $in: DEMAND_TRANSACTION_TYPES },
        ...buildDateMatch(from, to),
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
        quantity: { $sum: { $abs: '$quantity' } },
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

  return InventoryTransaction.aggregate(pipeline);
}

/**
 * Combined daily demand from sales orders and inventory transactions.
 * Per day, the larger source quantity is kept to limit double counting.
 */
async function getDailyDemandHistory(productId, options = {}) {
  const [fromOrders, fromInventory] = await Promise.all([
    getDailyDemandFromOrders(productId, options),
    getDailyDemandFromInventory(productId, options),
  ]);

  return mergeDailySeries([fromOrders, fromInventory]);
}

/**
 * Aggregate daily demand from orders for several products.
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

/**
 * Aggregate daily demand from inventory transactions for several products.
 */
async function getDailyDemandFromInventoryForProducts(productIds, options = {}) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  const productObjectIds = productIds.map(toObjectId);
  const { from, to } = options;

  const pipeline = [
    {
      $match: {
        productId: { $in: productObjectIds },
        type: { $in: DEMAND_TRANSACTION_TYPES },
        ...buildDateMatch(from, to),
      },
    },
    {
      $group: {
        _id: {
          productId: '$productId',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
        },
        quantity: { $sum: { $abs: '$quantity' } },
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

  return InventoryTransaction.aggregate(pipeline);
}

/**
 * Combined multi-product daily demand from orders and inventory.
 */
async function getDailyDemandHistoryForProducts(productIds, options = {}) {
  const [fromOrders, fromInventory] = await Promise.all([
    getDailyDemandFromOrdersForProducts(productIds, options),
    getDailyDemandFromInventoryForProducts(productIds, options),
  ]);

  return mergeMultiProductSeries([fromOrders, fromInventory]);
}

module.exports = {
  getDailyDemandFromOrders,
  getDailyDemandFromOrdersForProducts,
  getDailyDemandFromInventory,
  getDailyDemandFromInventoryForProducts,
  getDailyDemandHistory,
  getDailyDemandHistoryForProducts,
};
