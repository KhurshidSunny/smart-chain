const test = require('node:test');
const assert = require('node:assert/strict');
const { requestLog } = require('./http');
const { logEvent, writeLog } = require('./log');
const { resetMetrics, snapshot } = require('./metrics');

function linesFrom(fn) {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(String(line));
  try {
    fn();
  } finally {
    console.log = original;
  }
  return lines.map((line) => JSON.parse(line));
}

test('an order id ties the request log to the stored and consumed events', () => {
  resetMetrics();
  const middleware = requestLog('sales');
  const req = {
    headers: { 'x-request-id': 'req-1' },
    method: 'POST',
    path: '/orders',
  };
  const res = {
    statusCode: 201,
    locals: {},
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    on(event, fn) {
      this.finish = fn;
    },
    end() {
      this.finish();
    },
  };

  const logs = linesFrom(() => {
    middleware(req, res, () => {});
    res.locals.correlationId = 'order-1';
    res.locals.eventId = 'evt-1';
    res.end();
    logEvent('sales', 'event.stored', {
      eventId: 'evt-1',
      correlationId: 'order-1',
      eventType: 'sales.order.created',
    });
    logEvent('inventory', 'event.consumed', {
      eventId: 'evt-1',
      correlationId: 'order-1',
      eventType: 'sales.order.created',
    }, { durationMs: 4 });
  });

  assert.equal(logs.length, 3);
  for (const line of logs) {
    assert.equal(line.correlationId, 'order-1');
  }
  assert.equal(logs[0].service, 'sales');
  assert.equal(logs[0].requestId, 'req-1');
  assert.equal(logs[0].eventId, 'evt-1');
  assert.equal(logs[0].outcome, 'ok');
  assert.equal(typeof logs[0].durationMs, 'number');
  assert.equal(logs[1].event, 'event.stored');
  assert.equal(logs[2].service, 'inventory');
  assert.equal(logs[2].event, 'event.consumed');

  const metrics = snapshot();
  assert.equal(metrics.requests, 1);
  assert.equal(metrics.events.stored, 1);
  assert.equal(metrics.events.consumed, 1);
  assert.equal(metrics.latencyMs.count, 1);
});

test('request logs do not keep a password that was copied onto the log fields', () => {
  const line = JSON.parse(writeLog('info', {
    service: 'iam',
    event: 'http.request',
    password: 'nope',
    correlationId: 'req-9',
  }));
  assert.equal(line.password, '[redacted]');
  assert.equal(line.correlationId, 'req-9');
});
