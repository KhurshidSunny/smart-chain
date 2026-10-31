const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateReorderSuggestion,
} = require('../services/reorderSuggestionService');

test('reorders when forecast plus reorder point exceeds stock', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: 10,
    reorderPoint: 5,
    predictedDemand: 8,
    averageDailyDemand: 1.14,
    horizonDays: 7,
  });

  assert.equal(suggestion.predictedDemand, 8);
  assert.equal(suggestion.targetStock, 13);
  assert.equal(suggestion.suggestedQuantity, 3);
  assert.equal(suggestion.shouldReorder, true);
  assert.match(suggestion.reason, /exceeds available stock/);
});

test('ceils fractional predicted demand before the target stock is computed', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: 10,
    reorderPoint: 2,
    predictedDemand: 3.2,
  });

  assert.equal(suggestion.predictedDemand, 4);
  assert.equal(suggestion.targetStock, 6);
  assert.equal(suggestion.suggestedQuantity, 0);
  assert.equal(suggestion.shouldReorder, false);
  assert.equal(suggestion.reason, 'Stock is enough for the forecasted period');
});

test('suggests stock needed to reach the reorder point when demand is zero', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: 4,
    reorderPoint: 5,
    predictedDemand: 0,
  });

  assert.equal(suggestion.targetStock, 5);
  assert.equal(suggestion.suggestedQuantity, 1);
  assert.equal(suggestion.shouldReorder, true);
  assert.match(suggestion.reason, /at or below reorder point/);
});

test('does not reorder when stock already covers forecast and reorder point', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: 20,
    reorderPoint: 5,
    predictedDemand: 8,
  });

  assert.equal(suggestion.suggestedQuantity, 0);
  assert.equal(suggestion.shouldReorder, false);
});

test('treats negative or invalid numeric inputs as zero', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: -4,
    reorderPoint: 'x',
    predictedDemand: Number.NaN,
    averageDailyDemand: -1.5,
    horizonDays: 0,
  });

  assert.equal(suggestion.stockLevel, 0);
  assert.equal(suggestion.reorderPoint, 0);
  assert.equal(suggestion.predictedDemand, 0);
  assert.equal(suggestion.averageDailyDemand, 0);
  assert.equal(suggestion.horizonDays, 0);
  assert.equal(suggestion.suggestedQuantity, 0);
  assert.equal(suggestion.shouldReorder, false);
});

test('uses a seven-day horizon when horizonDays is omitted', () => {
  const suggestion = calculateReorderSuggestion({
    stockLevel: 1,
    reorderPoint: 0,
    predictedDemand: 0,
  });

  assert.equal(suggestion.horizonDays, 7);
});
