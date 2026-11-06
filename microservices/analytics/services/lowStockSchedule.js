const Product = require('../models/productModel');
const LowStockSignal = require('../models/lowStockSignalModel');
const { getDailyDemandHistoryForProducts } = require('./demandAggregationService');
const { resolveForecastOptions } = require('./forecastService');
const { buildReorderRows } = require('./reorderQuery');
const {
  shouldEmitLowStockPredicted,
  buildLowStockPredictedPayload,
} = require('./lowStockPredictedService');
const {
  signalDataVersion,
  decideLowStockEmission,
  lowStockCooldownMs,
  lowStockIntervalMs,
} = require('./lowStockSignal');
const {
  commitDomainAndOutbox,
  publishEvent,
  ROUTING_LOW_STOCK_PREDICTED,
  replicaSetConfigured,
} = require('./eventService');

let replicaWarningShown = false;

async function evaluateLowStockSignals() {
  if (!replicaSetConfigured()) {
    if (!replicaWarningShown) {
      console.warn('Low-stock signals need a MongoDB replica set');
      replicaWarningShown = true;
    }
    return { evaluated: 0, emitted: 0 };
  }

  const options = resolveForecastOptions({});
  const products = await Product.find({ active: true })
    .select('_id sku name stockLevel reorderPoint')
    .lean();
  if (products.length === 0) {
    return { evaluated: 0, emitted: 0 };
  }

  const historyPoints = await getDailyDemandHistoryForProducts(products.map((product) => product._id));
  const rows = buildReorderRows(products, historyPoints, options);
  let emitted = 0;

  for (const row of rows) {
    const candidate = {
      state: shouldEmitLowStockPredicted(row) ? 'low' : 'clear',
      dataVersion: signalDataVersion(row),
    };
    const filter = { productId: row.productId, horizonDays: row.horizonDays };
    const previous = await LowStockSignal.findOne(filter).lean();
    const decision = decideLowStockEmission({
      previous,
      candidate,
      now: Date.now(),
      cooldownMs: lowStockCooldownMs(),
    });

    if (!decision.emit) {
      if (!previous || previous.state !== candidate.state || previous.dataVersion !== candidate.dataVersion) {
        await LowStockSignal.updateOne(
          filter,
          { $set: { dataVersion: candidate.dataVersion, state: candidate.state } },
          { upsert: true }
        );
      }
      continue;
    }

    const stored = await commitDomainAndOutbox(async (session) => {
      const current = await LowStockSignal.findOne(filter).session(session);
      const again = decideLowStockEmission({
        previous: current,
        candidate,
        now: Date.now(),
        cooldownMs: lowStockCooldownMs(),
      });
      if (!again.emit) {
        return false;
      }
      const envelope = await publishEvent(
        ROUTING_LOW_STOCK_PREDICTED,
        buildLowStockPredictedPayload(row),
        { session }
      );
      await LowStockSignal.updateOne(
        filter,
        {
          $set: {
            dataVersion: candidate.dataVersion,
            state: 'low',
            eventId: envelope.eventId,
            emittedAt: new Date(),
          },
        },
        { upsert: true, session }
      );
      return true;
    });
    if (stored) {
      emitted += 1;
    }
  }

  return { evaluated: rows.length, emitted };
}

function startLowStockSchedule() {
  const tick = () => {
    evaluateLowStockSignals().catch((err) => {
      console.error('Low-stock evaluation failed:', err.message);
    });
  };
  const timer = setInterval(tick, lowStockIntervalMs());
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  tick();
}

module.exports = { evaluateLowStockSignals, startLowStockSchedule };
