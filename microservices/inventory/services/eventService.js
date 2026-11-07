const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

function loadEvents() {
  const candidates = [
    path.join(__dirname, '../../shared/events'),
    path.join(__dirname, '../shared/events'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'envelope.js'))) {
      return require(dir);
    }
  }
  throw new Error('Shared event module not found');
}

function loadObserve() {
  const candidates = [
    path.join(__dirname, '../../shared/observe'),
    path.join(__dirname, '../shared/observe'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.js'))) {
      return require(dir);
    }
  }
  throw new Error('Shared observe module not found');
}

const { logEvent, writeLog } = loadObserve();

const {
  buildEnvelope,
  followFrom,
  assertConsumerQueues,
  subscribeConsumer,
  read,
  save,
  createProducerOutbox,
  commitDomainAndOutbox: commitDomainAndOutboxWith,
} = loadEvents();
const PRODUCER = 'inventory';
const outbox = createProducerOutbox({
  mongoose,
  producer: PRODUCER,
  getChannel: () => channel,
  getExchange: () => process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange',
});
const commitDomainAndOutbox = (work) => commitDomainAndOutboxWith(mongoose, work);

let channel;
let activeHandlers = null;

const withFrameMax = (url) =>
  url.includes('?') ? `${url}&frameMax=131072` : `${url}?frameMax=131072`;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(withFrameMax(process.env.RABBITMQ_URL));
    console.log('Connected to RabbitMQ');
    channel = await connection.createConfirmChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}inventory_events`;

    await assertConsumerQueues(channel, {
      exchange,
      queue,
      routingKeys: ['sales.order.created', 'sales.order.cancelled', 'warehouse.order.packed'],
    });

    outbox.start();
    console.log('RabbitMQ Connected for Inventory Service');
    console.log(
      `Queue ${queue} bound to ${exchange} with routing keys 'sales.order.created', 'sales.order.cancelled', 'warehouse.order.packed'`
    );

    connection.on('error', (err) => {
      channel = null;
      writeLog('error', {
        service: PRODUCER,
        event: 'rabbit.error',
        outcome: 'error',
        error: { message: err.message },
      });
      reconnectRabbitMQ();
    });

    connection.on('close', () => {
      channel = null;
      console.log('RabbitMQ Connection Closed');
      reconnectRabbitMQ();
    });
  } catch (error) {
    console.error('RabbitMQ Connection Error (Inventory):', error.message);
    channel = null;
    setTimeout(() => {
      reconnectRabbitMQ().catch(() => {});
    }, 10000);
    return false;
  }
};

const reconnectRabbitMQ = async () => {
  console.log('Attempting to reconnect to RabbitMQ in 5 seconds...');
  setTimeout(async () => {
    channel = null;
    await connectRabbitMQ();
    if (activeHandlers) {
      subscribeToEvents(activeHandlers);
    }
  }, 5000);
};

const publishEvent = async (routingKey, payload, context = {}) => {
  const envelope = buildEnvelope({
    eventType: routingKey,
    producer: PRODUCER,
    payload,
    correlationId: context.correlationId,
    causationId: context.causationId,
  });
  await outbox.store(routingKey, envelope, context.session);
  logEvent(PRODUCER, 'event.stored', envelope, { routingKey });
  return envelope;
};

const subscribeToEvents = (eventHandlers) => {
  if (!channel) {
    console.warn('RabbitMQ not ready — skipped subscribe (Inventory)');
    return false;
  }

  activeHandlers = eventHandlers;
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}inventory_events`;
  subscribeConsumer(channel, { queue, handlers: eventHandlers, mongoose, consumer: PRODUCER });

  console.log(`Subscribed to events on queue ${queue}`);
};

const isRabbitReady = () => Boolean(channel);

module.exports = {
  connectRabbitMQ,
  isRabbitReady,
  publishEvent,
  subscribeToEvents,
  followFrom,
  read,
  save,
  commitDomainAndOutbox,
};
