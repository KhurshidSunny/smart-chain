const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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
  assertConsumerQueues,
  subscribeConsumer,
  createProducerOutbox,
  commitDomainAndOutbox: commitDomainAndOutboxWith,
  replicaSetConfigured: replicaSetConfiguredWith,
} = loadEvents();
const PRODUCER = 'analytics';
const outbox = createProducerOutbox({
  mongoose,
  producer: PRODUCER,
  getChannel: () => channel,
  getExchange: () => process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange',
});
const commitDomainAndOutbox = (work) => commitDomainAndOutboxWith(mongoose, work);
const replicaSetConfigured = () => replicaSetConfiguredWith(mongoose);

let channel;
let activeHandlers = null;

const ROUTING_LOW_STOCK_PREDICTED = 'analytics.low_stock.predicted';

const withFrameMax = (url) =>
  url.includes('?') ? `${url}&frameMax=131072` : `${url}?frameMax=131072`;

const connectRabbitMQ = async () => {
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) {
    console.warn('RABBITMQ_URL not set — analytics event publish disabled');
    channel = null;
    return false;
  }

  try {
    const connection = await amqp.connect(withFrameMax(rabbitUrl));
    channel = await connection.createConfirmChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}analytics_events`;

    await assertConsumerQueues(channel, {
      exchange,
      queue,
      routingKeys: [ROUTING_LOW_STOCK_PREDICTED],
    });

    outbox.start();
    console.log('RabbitMQ Connected for Analytics Service');
    console.log(
      `Queue ${queue} bound to ${exchange} with routing key '${ROUTING_LOW_STOCK_PREDICTED}'`
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

    return true;
  } catch (error) {
    console.error('RabbitMQ Connection Error (Analytics):', error.message);
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
    console.warn('RabbitMQ not ready — skipped subscribe (Analytics)');
    return false;
  }

  activeHandlers = eventHandlers;
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}analytics_events`;
  subscribeConsumer(channel, { queue, handlers: eventHandlers, mongoose, consumer: PRODUCER });

  console.log(`Subscribed to events on queue ${queue}`);
  return true;
};

const isRabbitReady = () => Boolean(channel);

module.exports = {
  ROUTING_LOW_STOCK_PREDICTED,
  connectRabbitMQ,
  isRabbitReady,
  publishEvent,
  subscribeToEvents,
  commitDomainAndOutbox,
  replicaSetConfigured,
};
