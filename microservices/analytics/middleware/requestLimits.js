const ALLOWED_HORIZONS = [7, 14, 30];

function reject(res, message) {
  return res.status(400).json({ message });
}

function positiveNumber(value, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= max;
}

function rejectInvalidAnalyticsQuery(req, res, next) {
  const { from, to, window, horizonDays, alpha, threshold, limit, sklearnKey } = req.query;

  if (from !== undefined && Number.isNaN(Date.parse(from))) {
    return reject(res, 'Invalid from date');
  }
  if (to !== undefined && Number.isNaN(Date.parse(to))) {
    return reject(res, 'Invalid to date');
  }
  if (horizonDays !== undefined && !ALLOWED_HORIZONS.includes(Number(horizonDays))) {
    return reject(res, 'Invalid horizonDays');
  }
  if (window !== undefined && !positiveNumber(window, 365)) {
    return reject(res, 'Invalid window');
  }
  if (alpha !== undefined && !positiveNumber(alpha, 1)) {
    return reject(res, 'Invalid alpha');
  }
  if (threshold !== undefined && !positiveNumber(threshold, 10)) {
    return reject(res, 'Invalid threshold');
  }
  if (limit !== undefined) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      return reject(res, 'Invalid limit');
    }
  }
  if (sklearnKey !== undefined && String(sklearnKey).length > 40) {
    return reject(res, 'Invalid sklearnKey');
  }

  return next();
}

function anomalyScope(user) {
  if (user && user.role === 'customer') {
    return { customerId: String(user.sub) };
  }
  return null;
}

module.exports = {
  rejectInvalidAnalyticsQuery,
  anomalyScope,
};
