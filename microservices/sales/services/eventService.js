const amqp = require('amqplib');
require('dotenv').config();

let channel;
let activeHandlers = null;

const withFrameMax = (url) =>
  url.includes('?') ? `${url}&frameMax=131072` : `${url}?frameMax=131072`;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(withFrameMax(process.env.RABBITMQ_URL));
    channel = await connection.createChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}sales_events`;

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    await channel.bindQueue(queue, exchange, 'inventory.reserved');
    await channel.bindQueue(queue, exchange, 'warehouse.order.packed');
    await channel.bindQueue(queue, exchange, 'logistics.shipment.shipping');
    await channel.bindQueue(queue, exchange, 'logistics.shipment.delivered');

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

const publishEvent = (routingKey, message) => {
  if (!channel) {
    console.warn(`RabbitMQ not ready — skipped publish: ${routingKey}`);
    return false;
  }

  const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
  const msgBuffer = Buffer.from(JSON.stringify(message));
  channel.publish(exchange, routingKey, msgBuffer);
  console.log(`Event Published: ${routingKey}`, message);
};

const subscribeToEvents = (eventHandlers) => {
  if (!channel) {
    console.warn('RabbitMQ not ready — skipped subscribe (Sales)');
    return false;
  }

  activeHandlers = eventHandlers;
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}sales_events`;

  channel.consume(
    queue,
    (msg) => {
      if (msg !== null) {
        const routingKey = msg.fields.routingKey;
        const message = JSON.parse(msg.content.toString());
        const handler = eventHandlers[routingKey];
        console.log(routingKey, message);

        if (handler) {
          Promise.resolve(handler(message))
            .then(() => channel.ack(msg))
            .catch((err) => {
              console.error(`Handler failed for ${routingKey}:`, err);
              channel.nack(msg, false, false);
            });
        } else {
          console.warn(`No handler for routing key: ${routingKey}`);
          channel.ack(msg);
        }
      }
    },
    { noAck: false }
  );

  console.log(`Subscribed to events on queue ${queue}`);
};

module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents };
