const { parseEnvelope } = require('./envelope');
const { PermanentError, isPermanent } = require('./errors');
const { RETRY_HEADER, retryDelays, deadLetterQueue } = require('./topology');
const { logEvent, redactString } = require('../observe');

function readRetryCount(msg) {
  const headers = msg.properties && msg.properties.headers;
  if (!headers) {
    return 0;
  }
  const value = Number(headers[RETRY_HEADER]);
  if (!Number.isInteger(value) || value < 0) {
    return 0;
  }
  return value;
}

function copyOptions(msg, headers) {
  const properties = msg.properties || {};
  return {
    persistent: true,
    contentType: properties.contentType || 'application/json',
    messageId: properties.messageId,
    correlationId: properties.correlationId,
    timestamp: properties.timestamp,
    headers: {
      ...(properties.headers || {}),
      ...headers,
    },
  };
}

function publishConfirmed(channel, exchange, routingKey, body, options) {
  return new Promise((resolve, reject) => {
    try {
      channel.publish(exchange, routingKey, body, options, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function sendConfirmed(channel, queue, body, options) {
  return new Promise((resolve, reject) => {
    try {
      channel.sendToQueue(queue, body, options, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function failureMessage(reason) {
  return reason && reason.message ? reason.message : String(reason);
}

async function settleFailure(channel, msg, queueName, reason, delays, meta) {
  const count = readRetryCount(msg);
  const routingKey = msg.fields.routingKey;
  const permanent = isPermanent(reason);
  if (permanent || count >= delays.length) {
    const dlq = deadLetterQueue(queueName);
    await sendConfirmed(
      channel,
      dlq,
      msg.content,
      copyOptions(msg, {
        'x-error-reason': redactString(failureMessage(reason)).slice(0, 200),
        'x-original-routing-key': routingKey,
      })
    );
    channel.ack(msg);
    logEvent(meta.service, 'event.failed', meta.envelope, {
      routingKey,
      outcome: 'error',
      error: { message: failureMessage(reason) },
    });
    return;
  }

  const attempt = count + 1;
  await publishConfirmed(
    channel,
    `${queueName}.retry.${attempt}`,
    routingKey,
    msg.content,
    copyOptions(msg, { [RETRY_HEADER]: attempt })
  );
  channel.ack(msg);
  logEvent(meta.service, 'event.retry', meta.envelope, {
    routingKey,
    outcome: 'error',
    error: { message: `retry ${attempt}: ${failureMessage(reason)}` },
  });
}

async function deliver(channel, msg, eventHandlers, queueName, delays, service) {
  const routingKey = msg.fields.routingKey;
  const meta = { service: service || 'events', envelope: null };
  let body;
  try {
    body = JSON.parse(msg.content.toString());
  } catch (err) {
    await settleFailure(channel, msg, queueName, new PermanentError('invalid JSON'), delays, meta);
    return;
  }

  const parsed = parseEnvelope(body);
  if (!parsed.ok) {
    await settleFailure(channel, msg, queueName, new PermanentError(parsed.reason), delays, meta);
    return;
  }

  meta.envelope = parsed.envelope;
  if (parsed.envelope.eventType !== routingKey) {
    await settleFailure(
      channel,
      msg,
      queueName,
      new PermanentError(`eventType is ${parsed.envelope.eventType}`),
      delays,
      meta
    );
    return;
  }

  const handler = eventHandlers[routingKey];
  if (!handler) {
    logEvent(meta.service, 'event.skipped', parsed.envelope, {
      routingKey,
      outcome: 'error',
      error: { message: 'no handler' },
    });
    channel.ack(msg);
    return;
  }

  const { envelope } = parsed;
  const started = Date.now();
  try {
    await handler(envelope.payload, envelope);
    channel.ack(msg);
    logEvent(meta.service, 'event.consumed', envelope, {
      routingKey,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    await settleFailure(channel, msg, queueName, err, delays, meta);
  }
}

function handleDelivery(channel, msg, eventHandlers, options = {}) {
  if (msg === null) {
    return Promise.resolve();
  }
  const queueName = options.queueName;
  const delays = retryDelays(options.delaysMs);
  if (!queueName) {
    return Promise.resolve().then(() => {
      channel.nack(msg, false, false);
    });
  }
  return deliver(channel, msg, eventHandlers, queueName, delays, options.service).catch((err) => {
    logEvent(options.service || 'events', 'event.failed', null, {
      routingKey: msg.fields && msg.fields.routingKey,
      outcome: 'error',
      error: { message: err.message },
    });
    channel.nack(msg, false, true);
  });
}

module.exports = { handleDelivery, readRetryCount };
