const state = {
  requests: 0,
  errors: 0,
  latency: { count: 0, sum: 0, max: 0 },
  events: { stored: 0, published: 0, consumed: 0, errors: 0 },
};

function recordRequest(status, durationMs) {
  state.requests += 1;
  if (status >= 500) {
    state.errors += 1;
  }
  state.latency.count += 1;
  state.latency.sum += durationMs;
  if (durationMs > state.latency.max) {
    state.latency.max = durationMs;
  }
}

function recordEvent(kind) {
  if (kind === 'stored') state.events.stored += 1;
  else if (kind === 'published') state.events.published += 1;
  else if (kind === 'consumed') state.events.consumed += 1;
  else if (kind === 'error') state.events.errors += 1;
}

function snapshot() {
  const { count, sum, max } = state.latency;
  return {
    requests: state.requests,
    errors: state.errors,
    latencyMs: {
      count,
      sum,
      max,
      avg: count === 0 ? 0 : Math.round(sum / count),
    },
    events: { ...state.events },
  };
}

function resetMetrics() {
  state.requests = 0;
  state.errors = 0;
  state.latency.count = 0;
  state.latency.sum = 0;
  state.latency.max = 0;
  state.events.stored = 0;
  state.events.published = 0;
  state.events.consumed = 0;
  state.events.errors = 0;
}

module.exports = { recordRequest, recordEvent, snapshot, resetMetrics };
