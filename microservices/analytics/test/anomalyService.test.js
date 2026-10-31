const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_Z_THRESHOLD,
  MIN_HISTORY_POINTS,
  evaluateQuantityAnomaly,
  flagAnomalousOrderLines,
  buildHistoryByProduct,
} = require('../services/anomalyService');
const { ids } = require('../test-support/fixtures/domainFixtures');

function sampleStdDev(values) {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

test('does not score a line when history is shorter than the minimum', () => {
  const evaluation = evaluateQuantityAnomaly(40, [10, 12]);

  assert.equal(MIN_HISTORY_POINTS, 3);
  assert.equal(evaluation.isAnomaly, false);
  assert.equal(evaluation.zScore, null);
  assert.equal(evaluation.stdDev, null);
  assert.equal(evaluation.severity, 'none');
  assert.equal(evaluation.pointsUsed, 2);
  assert.equal(evaluation.reason, null);
});

test('uses sample z-score and severity thresholds against product history', () => {
  const history = [10, 12, 14, 11];
  const average = 11.75;
  const stdDev = sampleStdDev(history);
  const highQuantity = 20;
  const expectedZ = Number(((highQuantity - average) / stdDev).toFixed(4));

  const flagged = evaluateQuantityAnomaly(highQuantity, history);
  assert.equal(flagged.isAnomaly, true);
  assert.equal(flagged.zScore, expectedZ);
  assert.equal(flagged.avgQuantity, 11.75);
  assert.equal(flagged.stdDev, Number(stdDev.toFixed(4)));
  assert.equal(flagged.severity, 'high');
  assert.ok(Math.abs(flagged.zScore) >= DEFAULT_Z_THRESHOLD + 1);
  assert.match(flagged.reason, /much higher than average/);

  const typical = evaluateQuantityAnomaly(12, history);
  assert.equal(typical.isAnomaly, false);
  assert.equal(typical.severity, 'none');
  assert.equal(typical.reason, null);
});

test('flags a change away from a fixed historical quantity', () => {
  const evaluation = evaluateQuantityAnomaly(20, [10, 10, 10]);

  assert.equal(evaluation.isAnomaly, true);
  assert.equal(evaluation.zScore, null);
  assert.equal(evaluation.stdDev, 0);
  assert.equal(evaluation.severity, 'medium');
  assert.match(evaluation.reason, /differs from the usual fixed amount/);
});

test('keeps a matching fixed quantity as normal', () => {
  const evaluation = evaluateQuantityAnomaly(10, [10, 10, 10]);

  assert.equal(evaluation.isAnomaly, false);
  assert.equal(evaluation.zScore, 0);
  assert.equal(evaluation.stdDev, 0);
  assert.equal(evaluation.severity, 'none');
  assert.equal(evaluation.reason, null);
});

test('describes unusually low quantities', () => {
  const evaluation = evaluateQuantityAnomaly(1, [10, 12, 14, 11, 13, 12]);
  assert.equal(evaluation.isAnomaly, true);
  assert.ok(evaluation.zScore < 0);
  assert.match(evaluation.reason, /lower than average/);
});

test('excludes the current order when building product history', () => {
  const prior = {
    _id: 'order-prior',
    items: [
      { productId: ids.rice, quantity: 10, name: 'Rice 1 kg', unitPrice: 5 },
      { productId: ids.rice, quantity: 10, name: 'Rice 1 kg', unitPrice: 5 },
      { productId: ids.rice, quantity: 10, name: 'Rice 1 kg', unitPrice: 5 },
    ],
  };
  const current = {
    _id: 'order-current',
    items: [
      { productId: ids.rice, quantity: 40, name: 'Rice 1 kg', unitPrice: 5 },
    ],
  };

  const history = buildHistoryByProduct([prior, current], current._id);
  assert.deepEqual(history.get(ids.rice), [10, 10, 10]);

  const anomalies = flagAnomalousOrderLines(current, [prior, current]);
  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].productId, ids.rice);
  assert.equal(anomalies[0].quantity, 40);
  assert.equal(anomalies[0].isAnomaly, true);
});
