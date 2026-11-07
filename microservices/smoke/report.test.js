const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sumQuantities,
  sameId,
  findByOrderId,
  failureReport,
  exitCode,
  directMongoUri,
} = require('./report');

test('demand quantities add up for one product', () => {
  assert.equal(sumQuantities([{ quantity: 2 }, { quantity: 2 }, { quantity: 8 }]), 12);
  assert.equal(sumQuantities(null), 0);
});

test('order ids match populated and plain values', () => {
  assert.equal(sameId({ _id: 'abc' }, 'abc'), true);
  assert.equal(sameId('abc', 'abc'), true);
  assert.equal(sameId({ _id: 'other' }, 'abc'), false);
  const row = findByOrderId([{ orderId: { _id: 'order-1' } }, { orderId: 'order-2' }], 'order-2');
  assert.equal(row.orderId, 'order-2');
});

test('a failed step exits non-zero and keeps the diagnostic', () => {
  const report = failureReport('wait for confirmed', 'timed out', { orderId: 'order-1', status: 'pending' });
  assert.equal(exitCode(report), 1);
  assert.equal(report.step, 'wait for confirmed');
  assert.equal(report.orderId, 'order-1');
  assert.equal(exitCode({ ok: true }), 0);
});

test('the smoke database connection stays on the given host', () => {
  assert.equal(
    directMongoUri('mongodb://127.0.0.1:27017/smartchain?replicaSet=rs0'),
    'mongodb://127.0.0.1:27017/smartchain?replicaSet=rs0&directConnection=true'
  );
  assert.equal(
    directMongoUri('mongodb://127.0.0.1:27017/smartchain'),
    'mongodb://127.0.0.1:27017/smartchain?directConnection=true'
  );
});
