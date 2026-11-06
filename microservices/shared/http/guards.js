const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const MAX_QUERY_LENGTH = 1000;
const MAX_QUERY_VALUE = 100;
const MAX_PARAM_LENGTH = 64;

function allowedOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || !raw.trim()) {
    return DEFAULT_ORIGINS;
  }
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function isAllowedOrigin(origin) {
  return allowedOrigins().includes(origin);
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

function corsAllowlist(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ message: 'Origin is not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
}

function queryLimits(req, res, next) {
  const raw = (req.originalUrl || req.url || '').split('?')[1] || '';
  if (raw.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ message: 'Query string is too long' });
  }

  for (const value of Object.values(req.query || {})) {
    const text = Array.isArray(value) ? value.join(',') : String(value);
    if (text.length > MAX_QUERY_VALUE) {
      return res.status(400).json({ message: 'A query value is too long' });
    }
  }

  return next();
}

function pathLimits(req, res, next) {
  const pathName = (req.path || '').split('?')[0];
  if (pathName.length > 200) {
    return res.status(400).json({ message: 'Path is too long' });
  }

  for (const value of Object.values(req.params || {})) {
    if (String(value).length > MAX_PARAM_LENGTH) {
      return res.status(400).json({ message: 'A path parameter is too long' });
    }
  }
  return next();
}

function jsonBodyLimit() {
  return process.env.JSON_BODY_LIMIT || '100kb';
}

function requireRoles(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

function objectIdParam(name) {
  return (req, res, next) => {
    const value = req.params[name];
    if (!/^[a-fA-F0-9]{24}$/.test(value || '')) {
      return res.status(400).json({ message: `Invalid ${name}` });
    }
    return next();
  };
}

function apiErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  console.error(err.stack || err.message || err);
  return res.status(500).json({ message: 'Something went wrong!' });
}

module.exports = {
  allowedOrigins,
  isAllowedOrigin,
  securityHeaders,
  corsAllowlist,
  queryLimits,
  pathLimits,
  jsonBodyLimit,
  requireRoles,
  objectIdParam,
  apiErrorHandler,
};
