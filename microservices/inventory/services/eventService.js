const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
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

const { buildEnvelope, followFrom, publishEnvelope, handleDelivery } = loadEvents();
const PRODUCER = 'inventory';

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

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    await channel.bindQueue(queue, exchange, 'sales.order.created');
    await channel.bindQueue(queue, exchange, 'sales.order.cancelled');
    await channel.bindQueue(queue, exchange, 'warehouse.order.packed');

    console.log('RabbitMQ Connected for Inventory Service');
    console.log(
      `Queue ${queue} bound to ${exchange} with routing keys 'sales.order.created', 'sales.order.cancelled', 'warehouse.order.packed'`
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
    console.warn('RabbitMQ not ready — skipped subscribe (Inventory)');
    return false;
  }

  activeHandlers = eventHandlers;
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}inventory_events`;

  channel.consume(queue, (msg) => handleDelivery(channel, msg, eventHandlers), { noAck: false });

  console.log(`Subscribed to events on queue ${queue}`);
};

module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents, followFrom };
