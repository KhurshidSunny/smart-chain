function publishWithConfirm(channel, exchange, routingKey, envelope) {
  const body = Buffer.from(JSON.stringify(envelope));
  const options = {
    persistent: true,
    contentType: 'application/json',
    messageId: envelope.eventId,
    correlationId: envelope.correlationId,
    timestamp: Math.floor(Date.parse(envelope.occurredAt) / 1000),
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err) => {
      if (settled) {
        return;
      }
      settled = true;
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    };

    try {
      channel.publish(exchange, routingKey, body, options, finish);
    } catch (err) {
      finish(err);
    }
  });
}

async function publishEnvelope(channel, exchange, routingKey, envelope) {
  if (!channel) {
    return false;
  }
  try {
    await publishWithConfirm(channel, exchange, routingKey, envelope);
    return true;
  } catch (err) {
    throw new Error(`Broker rejected ${routingKey}: ${err.message}`);
  }
}

module.exports = { publishWithConfirm, publishEnvelope };
