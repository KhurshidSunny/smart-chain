const test = require('node:test');
const assert = require('node:assert/strict');
const { readiness, liveness } = require('./http');

function capture(handler, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve(this);
        return this;
      },
    };
    Promise.resolve(handler(req || {}, res)).catch((err) => {
      resolve({ statusCode: 500, body: { message: err.message } });
    });
  });
}

test('liveness stays up without checking dependencies', async () => {
  const res = await capture(liveness('sales'));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.service, 'sales');
});

test('readiness fails when a required dependency is down', async () => {
  const handler = readiness('sales', {
    mongodb: () => true,
    rabbitmq: () => false,
  });
  const res = await capture(handler);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.status, 'not_ready');
  assert.equal(res.body.checks.mongodb, 'up');
  assert.equal(res.body.checks.rabbitmq, 'down');
});

test('readiness fails when a dependency check throws', async () => {
  const handler = readiness('iam', {
    mongodb: () => {
      throw new Error('connection refused');
    },
  });
  const res = await capture(handler);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.checks.mongodb, 'down');
});
