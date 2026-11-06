const test = require('node:test');
const assert = require('node:assert/strict');

const { signalDataVersion, decideLowStockEmission } = require('../services/lowStockSignal');

const horizonDays = 7;
const cooldownMs = 60 * 60 * 1000;

function candidate(stockLevel, predictedDemand) {
  const row = {
    horizonDays,
    forecastMethod: 'moving_average',
    predictedDemand,
    stockLevel,
    reorderPoint: 5,
  };
  return {
    state: 'low',
    dataVersion: signalDataVersion(row),
  };
}

test('an unchanged evaluation emits one signal inside the cooldown', () => {
  const next = candidate(2, 8);
  const first = decideLowStockEmission({
    previous: null,
    candidate: next,
    now: 1_000,
    cooldownMs,
  });
  assert.equal(first.emit, true);

  const second = decideLowStockEmission({
    previous: { state: 'low', dataVersion: next.dataVersion, emittedAt: 1_000 },
    candidate: next,
    now: 1_000 + cooldownMs - 1,
    cooldownMs,
  });
  assert.equal(second.emit, false);
});

test('a repeated read is not an emission', () => {
  const next = candidate(2, 8);
  const previous = { state: 'low', dataVersion: next.dataVersion, emittedAt: 5_000 };
  const again = decideLowStockEmission({
    previous,
    candidate: next,
    now: 6_000,
    cooldownMs,
  });
  assert.equal(again.emit, false);
});

test('changed stock or demand emits a new signal', () => {
  const previous = candidate(2, 8);
  const next = candidate(1, 9);
  assert.notEqual(previous.dataVersion, next.dataVersion);
  const decision = decideLowStockEmission({
    previous: { state: 'low', dataVersion: previous.dataVersion, emittedAt: 1_000 },
    candidate: next,
    now: 1_100,
    cooldownMs,
  });
  assert.equal(decision.emit, true);
});

test('the same evaluation emits again after the cooldown', () => {
  const next = candidate(2, 8);
  const decision = decideLowStockEmission({
    previous: { state: 'low', dataVersion: next.dataVersion, emittedAt: 1_000 },
    candidate: next,
    now: 1_000 + cooldownMs,
    cooldownMs,
  });
  assert.equal(decision.emit, true);
});

test('a clear state does not emit', () => {
  const decision = decideLowStockEmission({
    previous: { state: 'low', dataVersion: 'old', emittedAt: 1_000 },
    candidate: { state: 'clear', dataVersion: 'old' },
    now: 2_000,
    cooldownMs,
  });
  assert.equal(decision.emit, false);
});
