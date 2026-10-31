const test = require('node:test');
const assert = require('node:assert/strict');

const {
  allZeroDemand,
  denseDemand,
  intermittentDemand,
  invalidDemand,
  singlePointDemand,
} = require('../test-support/fixtures/demandSeries');
const { ids, orders, products } = require('../test-support/fixtures/domainFixtures');

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function assertValidSeries(series) {
  assert.ok(series.length > 0);

  for (const point of series) {
    assert.match(point.date, ISO_DAY);
    assert.equal(typeof point.quantity, 'number');
    assert.ok(Number.isFinite(point.quantity));
    assert.ok(point.quantity >= 0);
  }

  const dates = series.map((point) => point.date);
  assert.deepEqual(dates, dates.slice().sort());
  assert.equal(new Set(dates).size, dates.length);
}

test('demand fixtures use sorted UTC calendar dates and finite quantities', () => {
  [
    denseDemand,
    intermittentDemand,
    allZeroDemand,
    singlePointDemand,
  ].forEach(assertValidSeries);
});

test('demand fixtures cover dense, intermittent, zero, and single-point histories', () => {
  assert.equal(denseDemand.every((point) => point.quantity > 0), true);
  assert.equal(
    intermittentDemand.filter((point) => point.quantity === 0).length,
    10
  );
  assert.equal(
    intermittentDemand.filter((point) => point.quantity > 0).length,
    4
  );
  assert.equal(allZeroDemand.every((point) => point.quantity === 0), true);
  assert.equal(singlePointDemand.length, 1);
});

test('invalid demand fixture contains malformed dates, quantities, and points', () => {
  assert.equal(invalidDemand.some((point) => point === null), true);
  assert.equal(
    invalidDemand.some((point) => point && !ISO_DAY.test(point.date || '')),
    true
  );
  assert.equal(
    invalidDemand.some(
      (point) => point && !Number.isFinite(Number(point.quantity))
    ),
    true
  );
  assert.equal(
    invalidDemand.some((point) => point && !Object.hasOwn(point, 'date')),
    true
  );
});

test('domain fixtures keep product and order relationships consistent', () => {
  const [order] = orders;
  const riceLine = order.items.find((item) => item.productId === ids.rice);
  const oilLine = order.items.find(
    (item) => item.productId === ids.cookingOil
  );

  assert.equal(riceLine.name, products.rice.name);
  assert.equal(oilLine.name, products.cookingOil.name);
  assert.equal(
    order.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    ),
    order.totalAmount
  );
});

test('shared fixtures are immutable', () => {
  assert.equal(Object.isFrozen(denseDemand), true);
  assert.equal(Object.isFrozen(denseDemand[0]), true);
  assert.equal(Object.isFrozen(products), true);
  assert.equal(Object.isFrozen(products.rice), true);
  assert.equal(Object.isFrozen(orders), true);
  assert.equal(Object.isFrozen(orders[0].items), true);
});
