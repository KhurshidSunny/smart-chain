const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, '..', 'data', 'sklearn_holdout_cache.json');

let cachedPayload = null;

function readCacheFile() {
  if (cachedPayload !== null) {
    return cachedPayload;
  }

  try {
    if (!fs.existsSync(CACHE_PATH)) {
      cachedPayload = { products: {} };
      return cachedPayload;
    }

    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    cachedPayload = {
      generatedFrom: parsed.generatedFrom || null,
      notes: parsed.notes || null,
      products: parsed.products && typeof parsed.products === 'object' ? parsed.products : {},
    };
    return cachedPayload;
  } catch (err) {
    console.warn('Could not read sklearn holdout cache:', err.message);
    cachedPayload = { products: {} };
    return cachedPayload;
  }
}

/**
 * Look up offline sklearn holdout metrics for a productId.
 * Returns an unavailable payload when the product is not in the cache.
 */
function getSklearnHoldoutForProduct(productId) {
  const cache = readCacheFile();
  const key = String(productId);
  const entry = cache.products[key];

  if (!entry) {
    return {
      available: false,
      forecastMethod: 'sklearn_lag_ridge',
      reason:
        'No offline sklearn holdout cache entry for this productId. Run experiments/compare_forecast_methods.py and refresh analytics/data/sklearn_holdout_cache.json for demo SKUs.',
      evaluation: null,
      generatedFrom: cache.generatedFrom || null,
    };
  }

  return {
    available: true,
    forecastMethod: entry.forecastMethod || 'sklearn_lag_ridge',
    nLags: entry.nLags ?? null,
    averageDailyDemand: entry.averageDailyDemand ?? null,
    evaluation: entry.evaluation || null,
    notes: entry.notes || null,
    generatedFrom: cache.generatedFrom || null,
  };
}

module.exports = {
  getSklearnHoldoutForProduct,
  CACHE_PATH,
};
