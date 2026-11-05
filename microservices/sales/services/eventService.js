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

const {
  buildEnvelope,
  followFrom,
  publishEnvelope,
  assertConsumerQueues,
  subscribeConsumer,
  read,
  save,
} = loadEvents();
const PRODUCER = 'sales';

let channel;
let activeHandlers = null;

const withFrameMax = (url) =>
  url.includes('?') ? `${url}&frameMax=131072` : `${url}?frameMax=131072`;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(withFrameMax(process.env.RABBITMQ_URL));
    channel = await connection.createConfirmChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}sales_events`;

    await assertConsumerQueues(channel, {
      exchange,
      queue,
      routingKeys: [
        'inventory.reserved',
        'warehouse.order.packed',
        'logistics.shipment.shipping',
        'logistics.shipment.delivered',
      ],
    });

    console.log('RabbitMQ Connected for Sales Service');
    console.log(
      `Queue ${queue} bound to ${exchange} with routing keys: inventory.reserved, warehouse.order.packed, logistics.shipment.*, logistics.order.delivered`
    );

    connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err);
      reconnectRabbitMQ();
    });

    connection.on('close', () => {
      console.log('RabbitMQ Connection Closed');
      reconnectRabbitMQ();
    });
  } catch (error) {
    console.error('RabbitMQ Connection Error (Sales):', error.message);
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
  const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
  const published = await publishEnvelope(channel, exchange, routingKey, envelope);
  if (!published) {
    console.warn(`RabbitMQ not ready — skipped publish: ${routingKey}`);
    return false;
  }

  console.log(
    `Event Published: ${routingKey} eventId=${envelope.eventId} correlationId=${envelope.correlationId}`
  );
  return true;
};

const subscribeToEvents = (eventHandlers) => {
  if (!channel) {
    console.warn('RabbitMQ not ready — skipped subscribe (Sales)');
    return false;
  }

  activeHandlers = eventHandlers;
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}sales_events`;
  subscribeConsumer(channel, { queue, handlers: eventHandlers, mongoose, consumer: PRODUCER });

  console.log(`Subscribed to events on queue ${queue}`);
};

module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents, followFrom, read, save };
