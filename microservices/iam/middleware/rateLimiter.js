const rateLimit = require('express-rate-limit');

function positiveNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function createAuthRateLimit(overrides = {}) {
  return rateLimit({
    windowMs: overrides.windowMs ?? positiveNumber('AUTH_RATE_WINDOW_MS', 15 * 60 * 1000),
    max: overrides.max ?? positiveNumber('AUTH_RATE_MAX', 30),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' },
  });
}

const authRateLimit = createAuthRateLimit();
authRateLimit.createAuthRateLimit = createAuthRateLimit;

module.exports = authRateLimit;
