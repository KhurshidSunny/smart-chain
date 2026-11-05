const DEFAULT_DELAYS_MS = [1000, 5000, 15000];
const RETRY_HEADER = 'x-retry-count';

function retryDelays(configured) {
  const source = configured !== undefined ? configured : process.env.EVENT_RETRY_DELAYS_MS;
  if (source === undefined || source === null || source === '') {
    return DEFAULT_DELAYS_MS.slice();
  }
  const parts = Array.isArray(source) ? source : String(source).split(',');
  const delays = parts
    .map((part) => Number(String(part).trim()))
    .filter((delay) => Number.isInteger(delay) && delay >= 0);
  return delays.length > 0 ? delays : DEFAULT_DELAYS_MS.slice();
}

function deadLetterQueue(queueName) {
  return `${queueName}.dlq`;
}

function retryTargets(queueName, delays) {
  return delays.map((delayMs, index) => {
    const attempt = index + 1;
    return {
      attempt,
      delayMs,
      exchange: `${queueName}.retry.${attempt}`,
      queue: `${queueName}.retry.${attempt}`,
    };
  });
}

async function assertConsumerQueues(channel, { exchange, queue, routingKeys, delaysMs }) {
  const delays = retryDelays(delaysMs);
  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  for (const routingKey of routingKeys) {
    await channel.bindQueue(queue, exchange, routingKey);
  }

  await channel.assertQueue(deadLetterQueue(queue), { durable: true });
  for (const target of retryTargets(queue, delays)) {
    await channel.assertExchange(target.exchange, 'topic', { durable: true });
    await channel.assertQueue(target.queue, {
      durable: true,
      arguments: {
        'x-message-ttl': target.delayMs,
        'x-dead-letter-exchange': exchange,
      },
    });
    await channel.bindQueue(target.queue, target.exchange, '#');
  }
}

module.exports = {
  RETRY_HEADER,
  DEFAULT_DELAYS_MS,
  retryDelays,
  deadLetterQueue,
  retryTargets,
  assertConsumerQueues,
};
