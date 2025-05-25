require('dotenv').config();
const amqp = require('amqplib');
const PickingList = require('../models/pickingListModel')

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    console.log(`Connecting to RabbitMQ at ${process.env.RABBITMQ_URL}`);
    channel = await connection.createChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
    const queue = `${queuePrefix}warehouse_events`;

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    await channel.bindQueue(queue, exchange, 'inventory.reserved');


    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    throw error;
  }
};

// Don't immediately connect - we'll connect when needed
// connectRabbitMQ();


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
      const handler = eventHandlers[routingKey];

      if (handler) {
        handler(message);
        channel.ack(msg); // Acknowledge after handling
      } else {
        console.warn(`No handler for routing key: ${routingKey}`);
        channel.nack(msg, false, true); // Requeue if unhandled
      }
    }
  }, { noAck: false }); // Manual acknowledgment

  console.log(`Subscribed to events on queue ${queue}`);
};

// Export first to avoid circular dependencies
module.exports = {
  publishEvent,
  subscribeToEvents,
  connectRabbitMQ // Export this so we can explicitly connect when ready
};

// Subscribe to relevant events - moved to a function that can be called after models are initialized
const initSubscriptions = () => {
  subscribeToEvents('InventoryReserved', async (payload) => {
    const { orderId, items } = payload;
    const pickingList = new PickingList({
      orderId,
      orderNumber: `ORD-${orderId}`,
      items: items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        location: item.location || 'Unknown',
      })),
      status: 'Pending',
    });
    await pickingList.save();
    console.log("Picking Started for Order:", orderId);
    await publishEvent('PickingStarted', {
      pickingListId: pickingList._id,
      orderId,
      assignedTo: null,
    });
  });

  subscribeToEvents('OrderCancelled', async (payload) => {
    const { orderId } = payload;
    const pickingList = await PickingList.findOne({ orderId });
    if (pickingList && pickingList.status === 'Pending') {
      pickingList.status = 'Cancelled';
      await pickingList.save();
    }
  });
};

module.exports.initSubscriptions = initSubscriptions;