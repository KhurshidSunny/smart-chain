// microservices/warehouse/services/eventService.js
const amqp = require('amqplib');
require('dotenv').config();

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    console.log('Connected to RabbitMQ');
    channel = await connection.createChannel();
    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}warehouse_events`;

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    // Bind queue to relevant events
    await channel.bindQueue(queue, exchange, 'inventory.reserved');
    await channel.bindQueue(queue, exchange, 'sales.order.cancelled');

    console.log('RabbitMQ Connected for Warehouse Service');
    console.log(`Queue ${queue} bound to ${exchange} with routing keys 'inventory.reserved', 'sales.order.cancelled'`);

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err);
      reconnectRabbitMQ();
    });

    connection.on('close', () => {
      console.log('RabbitMQ Connection Closed');
      reconnectRabbitMQ();
    });
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
    throw error;
  }
};

const reconnectRabbitMQ = async () => {
  console.log('Attempting to reconnect to RabbitMQ in 5 seconds...');
  setTimeout(async () => {
    channel = null; // Reset channel
    await connectRabbitMQ();
    subscribeToEvents(require('../controllers/events/eventHandlerController')); // Re-subscribe
  }, 5000);
};

const publishEvent = (routingKey, message) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
  const msgBuffer = Buffer.from(JSON.stringify(message));
  channel.publish(exchange, routingKey, msgBuffer);
  console.log(`Event Published: ${routingKey}`, message);
};

const subscribeToEvents = (eventHandlers) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}warehouse_events`;

  channel.consume(queue, (msg) => {
    if (msg !== null) {
      const routingKey = msg.fields.routingKey;
      const message = JSON.parse(msg.content.toString());
      const handler = eventHandlers[`handle${routingKey.split('.').pop().charAt(0).toUpperCase() + routingKey.split('.').pop().slice(1)}`];

      if (handler) {
        handler(message);
        channel.ack(msg); // Acknowledge after handling
      } else {
        console.warn(`No handler for routing key: ${routingKey}`);
        channel.nack(msg, false, true); // Requeue if unhandled
      }
    }
  }, { noAck: false }); // Manually acknowledge messages

  console.log(`Subscribed to events on queue ${queue}`);
};

module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents };