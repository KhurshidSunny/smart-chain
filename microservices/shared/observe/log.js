const { redact } = require('./redact');
const { recordEvent } = require('./metrics');

function compact(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function writeLog(level, fields) {
  const line = JSON.stringify(compact({
    time: new Date().toISOString(),
    level,
    ...redact(fields),
  }));
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
  return line;
}

function logEvent(service, name, envelope, extra = {}) {
  const outcome = extra.outcome || 'ok';
  if (outcome === 'error') {
    recordEvent('error');
  } else if (name === 'event.stored') {
    recordEvent('stored');
  } else if (name === 'event.published') {
    recordEvent('published');
  } else if (name === 'event.consumed') {
    recordEvent('consumed');
  }
  const error = extra.error
    ? { name: extra.error.name, message: extra.error.message || String(extra.error) }
    : undefined;
  return writeLog(outcome === 'error' ? 'error' : 'info', {
    service,
    event: name,
    requestId: extra.requestId,
    correlationId: (envelope && envelope.correlationId) || extra.correlationId || undefined,
    eventId: envelope ? envelope.eventId : undefined,
    routingKey: extra.routingKey || (envelope && envelope.eventType),
    durationMs: extra.durationMs,
    outcome,
    error,
  });
}

module.exports = { writeLog, logEvent };
