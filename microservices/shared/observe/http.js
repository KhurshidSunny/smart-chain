const { randomUUID } = require('crypto');
const { writeLog } = require('./log');
const { recordRequest, snapshot } = require('./metrics');

const PROBES = new Set(['/health', '/live', '/ready', '/metrics']);

function header(req, name) {
  const value = req.headers && req.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function requestLog(service) {
  return function requestLogMiddleware(req, res, next) {
    const requestId = header(req, 'x-request-id') || randomUUID();
    const incoming = header(req, 'x-correlation-id');
    req.serviceName = service;
    req.requestId = requestId;
    req.correlationId = incoming || requestId;
    if (!res.locals) {
      res.locals = {};
    }
    res.locals.correlationId = req.correlationId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Correlation-Id', req.correlationId);
    const started = Date.now();
    res.on('finish', () => {
      const pathName = String(req.path || req.url || '').split('?')[0];
      if (PROBES.has(pathName)) {
        return;
      }
      const durationMs = Date.now() - started;
      const status = res.statusCode || 200;
      const outcome = status >= 500 ? 'error' : status >= 400 ? 'rejected' : 'ok';
      recordRequest(status, durationMs);
      writeLog(status >= 500 ? 'error' : 'info', {
        service,
        event: 'http.request',
        requestId,
        correlationId: res.locals.correlationId || req.correlationId,
        eventId: res.locals.eventId,
        method: req.method,
        path: pathName,
        status,
        durationMs,
        outcome,
      });
    });
    next();
  };
}

function liveness(service) {
  return function livenessHandler(req, res) {
    res.status(200).json({ status: 'ok', service });
  };
}

function readiness(service, checks) {
  return async function readinessHandler(req, res) {
    const report = {};
    let ready = true;
    for (const [name, check] of Object.entries(checks || {})) {
      try {
        const up = await check();
        report[name] = up ? 'up' : 'down';
        if (!up) {
          ready = false;
        }
      } catch (err) {
        report[name] = 'down';
        ready = false;
      }
    }
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      service,
      checks: report,
    });
  };
}

function metricsHandler(service) {
  return function metrics(req, res) {
    res.status(200).json({ service, ...snapshot() });
  };
}

function mountObservability(app, { service, checks }) {
  app.use(requestLog(service));
  app.get('/health', liveness(service));
  app.get('/live', liveness(service));
  app.get('/ready', readiness(service, checks));
  app.get('/metrics', metricsHandler(service));
}

module.exports = {
  requestLog,
  liveness,
  readiness,
  metricsHandler,
  mountObservability,
};
