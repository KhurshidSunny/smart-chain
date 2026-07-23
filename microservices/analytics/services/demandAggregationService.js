const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');

const CANCELLED_STATUS = 'cancelled';
// Fulfilled demand only — reserved is an intermediate step and would double-count with sold
const DEMAND_TRANSACTION_TYPES = ['sold'];

function toObjectId(productId) {
  if (productId instanceof mongoose.Types.ObjectId) {
    return productId;
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid productId');
  }
  return new mongoose.Types.ObjectId(productId);
}

function toProductIdString(productId) {
  return String(toObjectId(productId));
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

function sortDailySeries(series) {
  return series.slice().sort((a, b) => a.date.localeCompare(b.date));
}

function sortMultiProductSeries(series) {
  return series.slice().sort((a, b) => {
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
 * Aggregate fulfilled inventory activity into daily demand for one product.
 * Uses sold transactions only.
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
 * Daily demand history for one product.
 * Prefers sales orders; falls back to inventory sold when order history is empty.
 */
async function getDailyDemandHistory(productId, options = {}) {
  const fromOrders = await getDailyDemandFromOrders(productId, options);
  if (fromOrders.length > 0) {
    return sortDailySeries(fromOrders);
  }

  const fromInventory = await getDailyDemandFromInventory(productId, options);
  return sortDailySeries(fromInventory);
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
 * Aggregate daily demand from inventory sold transactions for several products.
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
 * Multi-product daily demand.
 * Uses orders when available for a product; otherwise inventory sold.
 */
async function getDailyDemandHistoryForProducts(productIds, options = {}) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  const fromOrders = await getDailyDemandFromOrdersForProducts(productIds, options);
  const productsWithOrders = new Set(fromOrders.map((point) => point.productId));

  const missingProductIds = productIds
    .map(toProductIdString)
    .filter((id) => !productsWithOrders.has(id));

  const fromInventory =
    missingProductIds.length > 0
      ? await getDailyDemandFromInventoryForProducts(missingProductIds, options)
      : [];

  return sortMultiProductSeries([...fromOrders, ...fromInventory]);
}

module.exports = {
  getDailyDemandFromOrders,
  getDailyDemandFromOrdersForProducts,
  getDailyDemandFromInventory,
  getDailyDemandFromInventoryForProducts,
  getDailyDemandHistory,
  getDailyDemandHistoryForProducts,
};
