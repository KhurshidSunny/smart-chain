const amqp = require('amqplib');
require('dotenv').config();

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('smartchain_exchange', 'topic', { durable: true });
    console.log('RabbitMQ Connected for Sales Service');
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
  }
};

const publishEvent = (routingKey, message) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  const msgBuffer = Buffer.from(JSON.stringify(message));
  channel.publish('smartchain_exchange', routingKey, msgBuffer);
  console.log(`Event Published: ${routingKey}`, message);
};

module.exports = { connectRabbitMQ, publishEvent };