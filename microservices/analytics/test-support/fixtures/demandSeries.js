const DAY_MS = 24 * 60 * 60 * 1000;
const START_DATE_MS = Date.parse('2026-01-01T00:00:00.000Z');

function buildDailySeries(quantities) {
  return Object.freeze(
    quantities.map((quantity, index) =>
      Object.freeze({
        date: new Date(START_DATE_MS + index * DAY_MS).toISOString().slice(0, 10),
        quantity,
      })
    )
  );
}

const denseDemand = buildDailySeries([
  12, 14, 13, 15, 16, 14, 17, 18, 16, 19, 17, 20, 18, 21,
]);

const intermittentDemand = buildDailySeries([
  0, 8, 0, 0, 0, 6, 0, 0, 9, 0, 0, 0, 7, 0,
]);

const allZeroDemand = buildDailySeries([0, 0, 0, 0, 0, 0, 0]);
const singlePointDemand = buildDailySeries([5]);

const invalidDemand = Object.freeze([
  Object.freeze({ date: 'invalid-date', quantity: 4 }),
  Object.freeze({ date: '2026-01-02', quantity: 'not-a-number' }),
  Object.freeze({ quantity: 3 }),
  null,
]);

module.exports = {
  allZeroDemand,
  denseDemand,
  intermittentDemand,
  invalidDemand,
  singlePointDemand,
};
