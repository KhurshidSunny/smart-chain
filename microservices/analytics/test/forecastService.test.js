const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_HORIZON_DAYS,
  WINDOW_BY_HORIZON,
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  forecastWithCroston,
  isIntermittentSeries,
  selectForecastMethod,
  resolveForecastOptions,
  evaluateForecastHoldout,
  meanAbsoluteError,
  meanAbsolutePercentageError,
} = require('../services/forecastService');
const {
  allZeroDemand,
  denseDemand,
  intermittentDemand,
  singlePointDemand,
} = require('../test-support/fixtures/demandSeries');

function quantitiesOf(history) {
  return history.map((point) => point.quantity);
}

function seriesFrom(quantities) {
  return quantities.map((quantity, index) => ({
    date: `2026-02-${String(index + 1).padStart(2, '0')}`,
    quantity,
  }));
}

function expectedMovingAverage(quantities, window, horizonDays) {
  if (quantities.length === 0) {
    return { averageDailyDemand: 0, predictedDemand: 0, pointsUsed: 0 };
  }
  const sample = quantities.slice(-window);
  const averageDailyDemand = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  return {
    averageDailyDemand: Number(averageDailyDemand.toFixed(4)),
    predictedDemand: Number((averageDailyDemand * horizonDays).toFixed(4)),
    pointsUsed: sample.length,
  };
}

function expectedExponentialSmoothing(quantities, alpha, horizonDays) {
  if (quantities.length === 0) {
    return { averageDailyDemand: 0, predictedDemand: 0, pointsUsed: 0 };
  }
  let smoothed = quantities[0];
  for (let index = 1; index < quantities.length; index += 1) {
    smoothed = alpha * quantities[index] + (1 - alpha) * smoothed;
  }
  return {
    averageDailyDemand: Number(smoothed.toFixed(4)),
    predictedDemand: Number((smoothed * horizonDays).toFixed(4)),
    pointsUsed: quantities.length,
  };
}

function expectedCroston(quantities, alpha, horizonDays) {
  const demandEvents = quantities.filter((value) => value > 0).length;
  if (quantities.length === 0 || demandEvents === 0) {
    return {
      averageDailyDemand: 0,
      predictedDemand: 0,
      demandEvents: 0,
      zeroDayRatio: quantities.length ? 0 : 0,
    };
  }

  let smoothedSize = null;
  let smoothedInterval = null;
  let periodsSinceDemand = 0;

  for (const demand of quantities) {
    periodsSinceDemand += 1;
    if (demand <= 0) {
      continue;
    }
    if (smoothedSize === null) {
      smoothedSize = demand;
      smoothedInterval = periodsSinceDemand;
    } else {
      smoothedSize = alpha * demand + (1 - alpha) * smoothedSize;
      smoothedInterval = alpha * periodsSinceDemand + (1 - alpha) * smoothedInterval;
    }
    periodsSinceDemand = 0;
  }

  const interval = smoothedInterval > 0 ? smoothedInterval : 1;
  const averageDailyDemand = smoothedSize / interval;
  return {
    averageDailyDemand: Number(averageDailyDemand.toFixed(4)),
    predictedDemand: Number((averageDailyDemand * horizonDays).toFixed(4)),
    demandEvents,
    zeroDayRatio: Number(
      (quantities.filter((value) => value === 0).length / quantities.length).toFixed(4)
    ),
  };
}

test('moving average uses the trailing window and horizon product', () => {
  const { window, horizonDays, alpha } = resolveForecastOptions({ horizonDays: 7 });
  const quantities = [10, 20, 30];
  const expected = expectedMovingAverage(quantities, window, horizonDays);
  const forecast = forecastWithMovingAverage(seriesFrom(quantities), { horizonDays: 7 });

  assert.equal(window, WINDOW_BY_HORIZON[7]);
  assert.equal(horizonDays, DEFAULT_HORIZON_DAYS);
  assert.equal(alpha, 0.3);
  assert.equal(forecast.forecastMethod, 'moving_average');
  assert.equal(forecast.alpha, null);
  assert.deepEqual(
    {
      averageDailyDemand: forecast.averageDailyDemand,
      predictedDemand: forecast.predictedDemand,
      pointsUsed: forecast.pointsUsed,
    },
    expected
  );
  assert.equal(forecast.averageDailyDemand, 20);
  assert.equal(forecast.predictedDemand, 140);
});

test('moving average returns zeros for an empty history', () => {
  const forecast = forecastWithMovingAverage([]);
  assert.equal(forecast.averageDailyDemand, 0);
  assert.equal(forecast.predictedDemand, 0);
  assert.equal(forecast.pointsUsed, 0);
});

test('exponential smoothing matches the recursive level update', () => {
  const quantities = [10, 20];
  const expected = expectedExponentialSmoothing(quantities, 0.3, 7);
  const forecast = forecastWithExponentialSmoothing(seriesFrom(quantities), {
    horizonDays: 7,
    alpha: 0.3,
  });

  assert.equal(forecast.forecastMethod, 'exponential_smoothing');
  assert.equal(forecast.window, null);
  assert.deepEqual(
    {
      averageDailyDemand: forecast.averageDailyDemand,
      predictedDemand: forecast.predictedDemand,
      pointsUsed: forecast.pointsUsed,
    },
    expected
  );
  assert.equal(forecast.averageDailyDemand, 13);
  assert.equal(forecast.predictedDemand, 91);
});

test('Croston separates demand size and inter-demand interval', () => {
  const quantities = [5, 0, 0, 10];
  const expected = expectedCroston(quantities, 0.3, 7);
  const forecast = forecastWithCroston(seriesFrom(quantities), {
    horizonDays: 7,
    alpha: 0.3,
  });

  assert.equal(forecast.forecastMethod, 'croston');
  assert.equal(forecast.window, null);
  assert.equal(forecast.averageDailyDemand, expected.averageDailyDemand);
  assert.equal(forecast.predictedDemand, expected.predictedDemand);
  assert.equal(forecast.demandEvents, 2);
  assert.equal(forecast.zeroDayRatio, 0.5);
  assert.equal(forecast.averageDailyDemand, 4.0625);
  assert.equal(forecast.predictedDemand, 28.4375);
});

test('Croston returns zero demand when every day is zero', () => {
  const forecast = forecastWithCroston(allZeroDemand, { horizonDays: 7 });
  assert.equal(forecast.averageDailyDemand, 0);
  assert.equal(forecast.predictedDemand, 0);
  assert.equal(forecast.demandEvents, 0);
});

test('method selection uses Croston for intermittent series and ES for long dense series', () => {
  assert.equal(isIntermittentSeries(quantitiesOf(intermittentDemand)), true);
  assert.equal(isIntermittentSeries(quantitiesOf(denseDemand)), false);
  assert.equal(isIntermittentSeries(quantitiesOf(allZeroDemand)), false);
  assert.equal(isIntermittentSeries(quantitiesOf(singlePointDemand)), false);

  assert.equal(
    selectForecastMethod(intermittentDemand, { horizonDays: 7 }).forecastMethod,
    'croston'
  );
  assert.equal(
    selectForecastMethod(denseDemand, { horizonDays: 7 }).forecastMethod,
    'exponential_smoothing'
  );
  assert.equal(
    selectForecastMethod(singlePointDemand, { horizonDays: 7 }).forecastMethod,
    'moving_average'
  );
});

test('short histories skip holdout evaluation', () => {
  assert.equal(evaluateForecastHoldout(singlePointDemand), null);
  assert.equal(evaluateForecastHoldout(seriesFrom([1, 2, 3])), null);
});

test('holdout MAE and MAPE use one-step predictions and skip zero actuals in MAPE', () => {
  assert.equal(meanAbsoluteError([10, 0], [8, 4]), 3);
  assert.equal(meanAbsolutePercentageError([10, 0], [8, 4]), 20);
  assert.equal(meanAbsolutePercentageError([0, 0], [1, 2]), null);
  assert.equal(meanAbsoluteError([], []), null);
  assert.equal(meanAbsoluteError([1], [1, 2]), null);

  const evaluation = evaluateForecastHoldout(seriesFrom([8, 8, 8, 0]), {
    horizonDays: 7,
  });
  assert.equal(evaluation.holdoutDays, 1);
  assert.equal(evaluation.pointsEvaluated, 1);
  assert.equal(evaluation.mape, null);
  assert.equal(typeof evaluation.mae, 'number');
});

test('selected forecast includes uncertainty and explanation for long histories', () => {
  const denseForecast = selectForecastMethod(denseDemand, { horizonDays: 7 });
  assert.equal(denseForecast.forecastMethod, 'exponential_smoothing');
  assert.ok(denseForecast.evaluation);
  assert.ok(denseForecast.uncertainty);
  assert.equal(denseForecast.uncertainty.level, 0.8);
  assert.ok(denseForecast.uncertainty.lower >= 0);
  assert.ok(denseForecast.uncertainty.upper >= denseForecast.uncertainty.lower);
  assert.match(denseForecast.explanation, /exponential smoothing/i);
  assert.match(denseForecast.explanation, /80% residual band/i);

  const sparseForecast = selectForecastMethod(intermittentDemand, { horizonDays: 7 });
  assert.equal(sparseForecast.forecastMethod, 'croston');
  assert.match(sparseForecast.explanation, /Croston/i);
  assert.match(sparseForecast.explanation, /intermittent/i);
});

test('short history leaves the residual band unavailable', () => {
  const forecast = selectForecastMethod(singlePointDemand, { horizonDays: 7 });
  assert.equal(forecast.forecastMethod, 'moving_average');
  assert.equal(forecast.evaluation, null);
  assert.equal(forecast.uncertainty, null);
  assert.match(forecast.explanation, /moving average/i);
  assert.match(forecast.explanation, /Uncertainty band unavailable/i);
});
