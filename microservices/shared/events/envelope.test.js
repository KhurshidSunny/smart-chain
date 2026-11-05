const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EVENT_VERSION,
  buildEnvelope,
  parseEnvelope,
  validatePayload,
  followFrom,
} = require('./envelope');
const { publishWithConfirm, publishEnvelope } = require('./confirm');
const { handleDelivery } = require('./delivery');

const orderPayload = {
  orderId: 'order-1',
  customerId: 'customer-1',
  items: [{ productId: 'product-1', quantity: 2 }],
};

test('version 1 envelope uses the order id as correlationId', () => {
  const envelope = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });

  assert.equal(envelope.eventVersion, EVENT_VERSION);
  assert.equal(envelope.eventType, 'sales.order.created');
  assert.equal(envelope.correlationId, 'order-1');
  assert.equal(envelope.causationId, null);
  assert.equal(envelope.producer, 'sales');
  assert.deepEqual(envelope.payload, orderPayload);

  const parsed = parseEnvelope(envelope);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.envelope.eventId, 'event-1');
});

test('a follow-up event keeps the order correlationId and records its cause', () => {
  const cause = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });
  const next = buildEnvelope({
    eventType: 'inventory.reserved',
    producer: 'inventory',
    payload: { orderId: 'order-1', reservationId: 'reservation-1', items: [] },
    eventId: 'event-2',
    occurredAt: '2026-11-05T04:00:01.000Z',
    ...followFrom(cause),
  });

  assert.equal(next.correlationId, 'order-1');
  assert.equal(next.causationId, 'event-1');
});

test('unsupported event versions are rejected', () => {
  const envelope = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });

  const parsed = parseEnvelope({ ...envelope, eventVersion: 2 });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, 'unsupported event version');
});

test('invalid payloads are rejected before publish', () => {
  const reason = validatePayload('sales.order.created', {
    orderId: 'order-1',
    customerId: 'customer-1',
  });
  assert.equal(reason, 'payload.items must be an array');
  assert.throws(
    () =>
      buildEnvelope({
        eventType: 'sales.order.created',
        producer: 'sales',
        payload: { orderId: 'order-1', customerId: 'customer-1' },
      }),
    /payload.items must be an array/
  );
});

test('a product event correlates on productId when there is no order', () => {
  const envelope = buildEnvelope({
    eventType: 'inventory.low_stock',
    producer: 'inventory',
    payload: { productId: 'product-9', currentLevel: 0, reorderPoint: 5 },
    eventId: 'event-9',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });

  assert.equal(envelope.correlationId, 'product-9');
});

test('publisher confirms are persistent and a nack is surfaced', async () => {
  let seen;
  const channel = {
    publish(exchange, routingKey, body, options, callback) {
      seen = { exchange, routingKey, body, options };
      callback(null);
      return true;
    },
  };
  const envelope = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });

  const published = await publishWithConfirm(channel, 'smartchain_exchange', envelope.eventType, envelope);
  assert.equal(published, true);
  assert.equal(seen.options.persistent, true);
  assert.equal(seen.options.messageId, 'event-1');
  assert.equal(seen.options.correlationId, 'order-1');
  assert.equal(JSON.parse(seen.body.toString()).eventVersion, 1);

  const nackChannel = {
    publish(_exchange, _routingKey, _body, _options, callback) {
      callback(new Error('nack'));
      return true;
    },
  };
  await assert.rejects(
    () => publishEnvelope(nackChannel, 'smartchain_exchange', envelope.eventType, envelope),
    /Broker rejected sales.order.created: nack/
  );
});

test('an unsupported version is nacked and not requeued', () => {
  const envelope = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });
  const calls = [];
  const channel = {
    nack(msg, allUpTo, requeue) {
      calls.push({ msg, allUpTo, requeue });
    },
    ack() {
      calls.push('ack');
    },
  };
  const msg = {
    fields: { routingKey: 'sales.order.created' },
    content: Buffer.from(JSON.stringify({ ...envelope, eventVersion: 2 })),
  };

  handleDelivery(channel, msg, {
    'sales.order.created': () => {
      throw new Error('handler should not run');
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].allUpTo, false);
  assert.equal(calls[0].requeue, false);
});

test('a missing channel skips publish instead of confirming', async () => {
  const envelope = buildEnvelope({
    eventType: 'sales.order.created',
    producer: 'sales',
    payload: orderPayload,
    eventId: 'event-1',
    occurredAt: '2026-11-05T04:00:00.000Z',
  });
  assert.equal(await publishEnvelope(null, 'smartchain_exchange', envelope.eventType, envelope), false);
});
