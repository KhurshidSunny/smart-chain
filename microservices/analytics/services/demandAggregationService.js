const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const InventoryTransaction = require('../models/inventoryTransactionModel');

const CANCELLED_STATUS = 'cancelled';
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
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
    createdAt.$gte = new Date(toUtcDayStart(from));
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isFinite(end.getTime())) {
      throw new Error('Invalid demand date');
    }
    if (DATE_ONLY_PATTERN.test(String(to))) {
      createdAt.$lt = new Date(toUtcDayStart(to) + DAY_MS);
    } else {
      createdAt.$lte = end;
    }
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

function toUtcDayStart(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Invalid demand date');
  }
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

function toUtcDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function fillMissingDemandDays(series, options = {}) {
  if (!Array.isArray(series) || series.length === 0) {
    return [];
  }

  const quantityByDate = new Map();

  for (const point of series) {
    if (!point || point.date == null) {
      throw new Error('Invalid demand date');
    }

    const date = toUtcDateKey(toUtcDayStart(point.date));
    const quantity = Number(point.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error('Invalid demand quantity');
    }

    quantityByDate.set(date, (quantityByDate.get(date) || 0) + quantity);
  }

  const observedDates = [...quantityByDate.keys()].sort();
  const start = options.from
    ? toUtcDayStart(options.from)
    : toUtcDayStart(observedDates[0]);
  const end = options.to
    ? toUtcDayStart(options.to)
    : toUtcDayStart(observedDates[observedDates.length - 1]);

  if (start > end) {
    throw new Error('Invalid demand date range');
  }

  const normalized = [];
  for (let timestamp = start; timestamp <= end; timestamp += DAY_MS) {
    const date = toUtcDateKey(timestamp);
    normalized.push({
      date,
      quantity: quantityByDate.get(date) || 0,
    });
  }

  return normalized;
}

function fillMissingDemandDaysForProducts(series, options = {}) {
  if (!Array.isArray(series) || series.length === 0) {
    return [];
  }

  const byProduct = new Map();
  for (const point of series) {
    const productId = String((point && point.productId) || '');
    if (!productId) {
      throw new Error('Invalid demand product');
    }
    const productSeries = byProduct.get(productId) || [];
    productSeries.push({ date: point.date, quantity: point.quantity });
    byProduct.set(productId, productSeries);
  }

  return [...byProduct.keys()]
    .sort()
    .flatMap((productId) =>
      fillMissingDemandDays(byProduct.get(productId), options).map((point) => ({
        productId,
        ...point,
      }))
    );
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
    return fillMissingDemandDays(sortDailySeries(fromOrders), options);
  }

  const fromInventory = await getDailyDemandFromInventory(productId, options);
  return fillMissingDemandDays(sortDailySeries(fromInventory), options);
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

  return fillMissingDemandDaysForProducts(
    sortMultiProductSeries([...fromOrders, ...fromInventory]),
    options
  );
}

module.exports = {
  buildDateMatch,
  getDailyDemandFromOrders,
  getDailyDemandFromOrdersForProducts,
  getDailyDemandFromInventory,
  getDailyDemandFromInventoryForProducts,
  getDailyDemandHistory,
  getDailyDemandHistoryForProducts,
  fillMissingDemandDays,
  fillMissingDemandDaysForProducts,
};
