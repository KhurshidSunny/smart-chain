const { parseEnvelope } = require('./envelope');
const { PermanentError, isPermanent } = require('./errors');
const { RETRY_HEADER, retryDelays, deadLetterQueue } = require('./topology');

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

async function settleFailure(channel, msg, queueName, reason, delays) {
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
        'x-error-reason': String(reason && reason.message ? reason.message : reason).slice(0, 200),
        'x-original-routing-key': routingKey,
      })
    );
    channel.ack(msg);
    console.error(
      `Dead-lettered ${routingKey} on ${dlq}: ${reason && reason.message ? reason.message : reason}`
    );
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
  console.error(
    `Retry ${attempt} scheduled for ${routingKey}: ${reason && reason.message ? reason.message : reason}`
  );
}

async function deliver(channel, msg, eventHandlers, queueName, delays) {
  const routingKey = msg.fields.routingKey;
  let body;
  try {
    body = JSON.parse(msg.content.toString());
  } catch (err) {
    await settleFailure(channel, msg, queueName, new PermanentError('invalid JSON'), delays);
    return;
  }

  const parsed = parseEnvelope(body);
  if (!parsed.ok) {
    await settleFailure(channel, msg, queueName, new PermanentError(parsed.reason), delays);
    return;
  }

  if (parsed.envelope.eventType !== routingKey) {
    await settleFailure(
      channel,
      msg,
      queueName,
      new PermanentError(`eventType is ${parsed.envelope.eventType}`),
      delays
    );
    return;
  }

  const handler = eventHandlers[routingKey];
  if (!handler) {
    console.warn(`No handler for routing key: ${routingKey}`);
    channel.ack(msg);
    return;
  }

  const { envelope } = parsed;
  console.log(
    routingKey,
    `eventId=${envelope.eventId}`,
    `correlationId=${envelope.correlationId}`
  );

  try {
    await handler(envelope.payload, envelope);
    channel.ack(msg);
  } catch (err) {
    await settleFailure(channel, msg, queueName, err, delays);
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
  return deliver(channel, msg, eventHandlers, queueName, delays).catch((err) => {
    console.error(`Delivery failed for ${msg.fields && msg.fields.routingKey}:`, err);
    channel.nack(msg, false, true);
  });
}

module.exports = { handleDelivery, readRetryCount };
