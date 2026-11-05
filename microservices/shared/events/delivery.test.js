const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEnvelope } = require('./envelope');
const { handleDelivery } = require('./delivery');
const { PermanentError } = require('./errors');
const { retryTargets, deadLetterQueue } = require('./topology');

const queueName = 'smart-chain-inventory_events';

function envelope() {
  return buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: {
      orderId: 'order-1',
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    },
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });
}

function message(body, headers) {
  return {
    fields: { routingKey: 'sales.order.created' },
    content: Buffer.from(JSON.stringify(body)),
    properties: { headers: headers || {}, contentType: 'application/json', messageId: 'event-1' },
  };
}

function channel() {
  const calls = [];
  return {
    calls,
    publish(exchange, routingKey, body, options, callback) {
      calls.push({ type: 'publish', exchange, routingKey, body, options });
      callback(null);
    },
    sendToQueue(queue, body, options, callback) {
      calls.push({ type: 'send', queue, body, options });
      callback(null);
    },
    ack() {
      calls.push({ type: 'ack' });
    },
    nack(msg, allUpTo, requeue) {
      calls.push({ type: 'nack', allUpTo, requeue });
    },
  };
}

test('a transient failure is scheduled once and a later delivery succeeds', async () => {
  let attempts = 0;
  const broker = channel();
  const handlers = {
    'sales.order.created': async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('database timeout');
      }
    },
  };

  await handleDelivery(broker, message(envelope()), handlers, { queueName });

  const scheduled = broker.calls.find((call) => call.type === 'publish');
  assert.equal(scheduled.exchange, `${queueName}.retry.1`);
  assert.equal(scheduled.routingKey, 'sales.order.created');
  assert.equal(scheduled.options.headers['x-retry-count'], 1);
  assert.equal(broker.calls.some((call) => call.type === 'ack'), true);
  assert.equal(broker.calls.some((call) => call.type === 'nack'), false);

  const second = channel();
  await handleDelivery(
    second,
    message(envelope(), scheduled.options.headers),
    handlers,
    { queueName }
  );
  assert.equal(attempts, 2);
  assert.deepEqual(
    second.calls.map((call) => call.type),
    ['ack']
  );
});

test('a permanent handler failure reaches the dead-letter queue once', async () => {
  const broker = channel();
  let attempts = 0;
  await handleDelivery(
    broker,
    message(envelope()),
    {
      'sales.order.created': async () => {
        attempts += 1;
        throw new PermanentError('order payload cannot be stored');
      },
    },
    { queueName }
  );

  assert.equal(attempts, 1);
  const dead = broker.calls.find((call) => call.type === 'send');
  assert.equal(dead.queue, deadLetterQueue(queueName));
  assert.equal(
    broker.calls.filter((call) => call.type === 'publish').length,
    0
  );
  assert.equal(broker.calls.filter((call) => call.type === 'ack').length, 1);
});

test('the last retry failure is dead-lettered and not published again', async () => {
  const delays = retryTargets(queueName, [1000, 5000, 15000]);
  const broker = channel();
  await handleDelivery(
    broker,
    message(envelope(), { 'x-retry-count': delays.length }),
    {
      'sales.order.created': async () => {
        throw new Error('still down');
      },
    },
    { queueName }
  );

  assert.equal(broker.calls.filter((call) => call.type === 'publish').length, 0);
  assert.equal(broker.calls.find((call) => call.type === 'send').queue, deadLetterQueue(queueName));
  assert.equal(broker.calls.some((call) => call.type === 'ack'), true);
});

test('a failed retry publish is requeued and not acknowledged', async () => {
  const broker = channel();
  broker.publish = (exchange, routingKey, body, options, callback) => {
    broker.calls.push({ type: 'publish', exchange });
    callback(new Error('channel closed'));
  };

  await handleDelivery(
    broker,
    message(envelope()),
    {
      'sales.order.created': async () => {
        throw new Error('database timeout');
      },
    },
    { queueName }
  );

  assert.equal(broker.calls.some((call) => call.type === 'ack'), false);
  const nack = broker.calls.find((call) => call.type === 'nack');
  assert.equal(nack.requeue, true);
  assert.equal(nack.allUpTo, false);
});
