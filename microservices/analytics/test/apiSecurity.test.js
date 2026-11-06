const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {
  securityHeaders,
  corsAllowlist,
  queryLimits,
  pathLimits,
  jsonBodyLimit,
  requireRoles,
  objectIdParam,
  apiErrorHandler,
} = require('../../shared/http/guards');
const { anomalyScope, rejectInvalidAnalyticsQuery } = require('../middleware/requestLimits');
const { STAFF_ANALYTICS_ROLES, ANOMALY_ROLES } = require('../middleware/roles');

function listen(app) {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function send(server, { method = 'GET', path = '/', headers = {}, body }) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let parsed = text;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('json body limit defaults to 100kb', () => {
  assert.equal(jsonBodyLimit(), '100kb');
});

test('customer anomaly scope is that customer only', () => {
  assert.deepEqual(anomalyScope({ role: 'customer', sub: 'abc123' }), { customerId: 'abc123' });
  assert.equal(anomalyScope({ role: 'sales_manager', sub: 'abc123' }), null);
  assert.equal(anomalyScope({ role: 'admin', sub: 'abc123' }), null);
});

test('analytics query limits reject an out-of-range limit and a bad horizon', async () => {
  const cases = [
    [{ limit: '500' }, 400],
    [{ limit: '0' }, 400],
    [{ horizonDays: '9' }, 400],
    [{ threshold: '0' }, 400],
    [{ from: 'not-a-date' }, 400],
    [{ limit: '200', horizonDays: '7' }, 200],
  ];

  for (const [query, expected] of cases) {
    const result = await new Promise((resolve) => {
      const res = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          resolve({ status: this.statusCode, body });
        },
      };
      rejectInvalidAnalyticsQuery({ query }, res, () => resolve({ status: 200 }));
    });
    assert.equal(result.status, expected, JSON.stringify(query));
  }
});

test('staff analytics roles block a customer and allow an inventory manager', async () => {
  const app = express();
  app.use(securityHeaders);
  app.use(corsAllowlist);
  app.use(express.json({ limit: '1kb' }));
  app.use(queryLimits);
  app.use(pathLimits);
  app.use((req, res, next) => {
    const role = req.header('x-role');
    if (role) req.user = { role, sub: 'user-1' };
    next();
  });
  app.get('/health', (req, res) => res.json({ ok: true }));
  app.get('/reorder', requireRoles(STAFF_ANALYTICS_ROLES), (req, res) => res.json({ ok: true }));
  app.get('/anomalies', requireRoles(ANOMALY_ROLES), (req, res) => {
    res.json({ scope: anomalyScope(req.user) });
  });
  app.get('/demand/:productId', objectIdParam('productId'), (req, res) => res.json({ ok: true }));
  app.post('/echo', (req, res) => res.json({ ok: true }));
  app.use(apiErrorHandler);

  const server = await listen(app);
  try {
    const blocked = await send(server, {
      path: '/reorder',
      headers: { 'x-role': 'customer', origin: 'http://localhost:5173' },
    });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(blocked.headers['x-content-type-options'], 'nosniff');

    const allowed = await send(server, {
      path: '/reorder',
      headers: { 'x-role': 'inventory_manager', origin: 'http://localhost:5173' },
    });
    assert.equal(allowed.status, 200);

    const foreign = await send(server, {
      path: '/reorder',
      headers: { 'x-role': 'admin', origin: 'https://evil.example' },
    });
    assert.equal(foreign.status, 403);
    assert.equal(foreign.body.message, 'Origin is not allowed');

    const health = await send(server, { path: '/health' });
    assert.equal(health.status, 200);
    assert.equal(health.headers['access-control-allow-origin'], undefined);

    const preflight = await send(server, {
      method: 'OPTIONS',
      path: '/reorder',
      headers: { origin: 'http://127.0.0.1:5173' },
    });
    assert.equal(preflight.status, 204);

    const customerAnomalies = await send(server, {
      path: '/anomalies',
      headers: { 'x-role': 'customer' },
    });
    assert.equal(customerAnomalies.status, 200);
    assert.deepEqual(customerAnomalies.body.scope, { customerId: 'user-1' });

    const warehouseStaff = await send(server, {
      path: '/anomalies',
      headers: { 'x-role': 'warehouse_staff' },
    });
    assert.equal(warehouseStaff.status, 403);

    const longQuery = await send(server, { path: `/?q=${'a'.repeat(101)}` });
    assert.equal(longQuery.status, 400);

    const badId = await send(server, { path: '/demand/not-an-id' });
    assert.equal(badId.status, 400);

    const productId = '64b000000000000000000001';
    const goodId = await send(server, { path: `/demand/${productId}` });
    assert.equal(goodId.status, 200);

    const oversized = await send(server, {
      method: 'POST',
      path: '/echo',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blob: 'x'.repeat(2048) }),
    });
    assert.equal(oversized.status, 413);

    const broken = await send(server, {
      method: 'POST',
      path: '/echo',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    assert.equal(broken.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
