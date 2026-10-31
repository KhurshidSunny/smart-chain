const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDateMatch,
  fillMissingDemandDays,
  fillMissingDemandDaysForProducts,
} = require('../services/demandAggregationService');
const { selectForecastMethod } = require('../services/forecastService');
const {
  denseDemand,
  intermittentDemand,
} = require('../test-support/fixtures/demandSeries');
const { ids } = require('../test-support/fixtures/domainFixtures');

test('keeps an already continuous demand series unchanged', () => {
  assert.deepEqual(fillMissingDemandDays(denseDemand), denseDemand);
});

test('fills missing UTC calendar days with zero demand', () => {
  const observedDemand = intermittentDemand.filter(
    (point) => point.quantity > 0
  );

  const normalized = fillMissingDemandDays(observedDemand, {
    from: '2026-01-01',
    to: '2026-01-14',
  });

  assert.deepEqual(normalized, intermittentDemand);
});

test('uses observed dates as bounds when no range is supplied', () => {
  const normalized = fillMissingDemandDays([
    { date: '2026-01-03', quantity: 4 },
    { date: '2026-01-05', quantity: 6 },
  ]);

  assert.deepEqual(normalized, [
    { date: '2026-01-03', quantity: 4 },
    { date: '2026-01-04', quantity: 0 },
    { date: '2026-01-05', quantity: 6 },
  ]);
});

test('treats a date-only upper bound as the complete UTC day', () => {
  assert.deepEqual(buildDateMatch('2026-01-01', '2026-01-03'), {
    createdAt: {
      $gte: new Date('2026-01-01T00:00:00.000Z'),
      $lt: new Date('2026-01-04T00:00:00.000Z'),
    },
  });

  assert.deepEqual(
    buildDateMatch(null, '2026-01-03T12:30:00.000Z'),
    {
      createdAt: {
        $lte: new Date('2026-01-03T12:30:00.000Z'),
      },
    }
  );
});

test('combines duplicate dates before filling gaps', () => {
  const normalized = fillMissingDemandDays([
    { date: '2026-01-01', quantity: 2 },
    { date: '2026-01-01T18:00:00.000Z', quantity: 3 },
    { date: '2026-01-03', quantity: 1 },
  ]);

  assert.deepEqual(normalized, [
    { date: '2026-01-01', quantity: 5 },
    { date: '2026-01-02', quantity: 0 },
    { date: '2026-01-03', quantity: 1 },
  ]);
});

test('normalizes each product independently in a batch', () => {
  const normalized = fillMissingDemandDaysForProducts(
    [
      { productId: ids.cookingOil, date: '2026-01-02', quantity: 2 },
      { productId: ids.rice, date: '2026-01-01', quantity: 5 },
      { productId: ids.rice, date: '2026-01-03', quantity: 4 },
    ],
    { from: '2026-01-01', to: '2026-01-03' }
  );

  assert.deepEqual(normalized, [
    { productId: ids.rice, date: '2026-01-01', quantity: 5 },
    { productId: ids.rice, date: '2026-01-02', quantity: 0 },
    { productId: ids.rice, date: '2026-01-03', quantity: 4 },
    { productId: ids.cookingOil, date: '2026-01-01', quantity: 0 },
    { productId: ids.cookingOil, date: '2026-01-02', quantity: 2 },
    { productId: ids.cookingOil, date: '2026-01-03', quantity: 0 },
  ]);
});

test('allows Croston selection for sparse observed demand after normalization', () => {
  const observedDemand = intermittentDemand.filter(
    (point) => point.quantity > 0
  );
  const normalized = fillMissingDemandDays(observedDemand, {
    from: '2026-01-01',
    to: '2026-01-14',
  });

  const forecast = selectForecastMethod(normalized, { horizonDays: 7 });

  assert.equal(forecast.forecastMethod, 'croston');
  assert.equal(forecast.demandEvents, 4);
  assert.equal(forecast.zeroDayRatio, 0.7143);
});

test('returns an empty series when no demand was observed', () => {
  assert.deepEqual(
    fillMissingDemandDays([], {
      from: '2026-01-01',
      to: '2026-01-07',
    }),
    []
  );
  assert.deepEqual(fillMissingDemandDaysForProducts([]), []);
});

test('rejects invalid dates, ranges, quantities, and product identifiers', () => {
  assert.throws(
    () => fillMissingDemandDays([{ date: 'invalid', quantity: 1 }]),
    /Invalid demand date/
  );
  assert.throws(
    () =>
      fillMissingDemandDays(
        [{ date: '2026-01-01', quantity: 1 }],
        { from: '2026-01-02', to: '2026-01-01' }
      ),
    /Invalid demand date range/
  );
  assert.throws(
    () =>
      fillMissingDemandDays([{ date: '2026-01-01', quantity: -1 }]),
    /Invalid demand quantity/
  );
  assert.throws(
    () =>
      fillMissingDemandDaysForProducts([
        { productId: '', date: '2026-01-01', quantity: 1 },
      ]),
    /Invalid demand product/
  );
});
