const DAY_MS = 24 * 60 * 60 * 1000;

function lowStockCooldownMs() {
  const raw = process.env.EVENT_LOW_STOCK_COOLDOWN_MS;
  if (raw === undefined || raw === '') {
    return DAY_MS;
  }
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms < 0) {
    return DAY_MS;
  }
  return ms;
}

function lowStockIntervalMs() {
  const raw = process.env.EVENT_LOW_STOCK_INTERVAL_MS;
  if (raw === undefined || raw === '') {
    return 15 * 60 * 1000;
  }
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) {
    return 15 * 60 * 1000;
  }
  return ms;
}

function signalDataVersion(row) {
  return [
    row.horizonDays,
    row.forecastMethod == null ? '' : row.forecastMethod,
    Number(row.predictedDemand),
    Number(row.stockLevel),
    Number(row.reorderPoint),
  ].join(':');
}

function decideLowStockEmission({ previous, candidate, now, cooldownMs }) {
  if (candidate.state !== 'low') {
    return { emit: false };
  }
  if (
    previous &&
    previous.state === 'low' &&
    previous.dataVersion === candidate.dataVersion &&
    previous.emittedAt != null &&
    now - new Date(previous.emittedAt).getTime() < cooldownMs
  ) {
    return { emit: false };
  }
  return { emit: true };
}

module.exports = {
  lowStockCooldownMs,
  lowStockIntervalMs,
  signalDataVersion,
  decideLowStockEmission,
};
