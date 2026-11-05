const { parseEnvelope } = require('./envelope');

function handleDelivery(channel, msg, eventHandlers) {
  if (msg === null) {
    return;
  }

  const routingKey = msg.fields.routingKey;
  let body;
  try {
    body = JSON.parse(msg.content.toString());
  } catch (err) {
    console.error(`Rejected event ${routingKey}: invalid JSON`);
    channel.nack(msg, false, false);
    return;
  }

  const parsed = parseEnvelope(body);
  if (!parsed.ok) {
    console.error(`Rejected event ${routingKey}: ${parsed.reason}`);
    channel.nack(msg, false, false);
    return;
  }

  if (parsed.envelope.eventType !== routingKey) {
    console.error(
      `Rejected event ${routingKey}: eventType is ${parsed.envelope.eventType}`
    );
    channel.nack(msg, false, false);
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

  Promise.resolve(handler(envelope.payload, envelope))
    .then(() => channel.ack(msg))
    .catch((err) => {
      console.error(`Handler failed for ${routingKey}:`, err);
      channel.nack(msg, false, false);
    });
}

module.exports = { handleDelivery };
