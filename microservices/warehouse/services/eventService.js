const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('warehouse_events', 'topic', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    throw error;
  }
};

// Initialize connection on service start
connectRabbitMQ();

const publishEvent = async (eventName, payload) => {
  if (!channel) {
    await connectRabbitMQ();
  }
  const routingKey = `warehouse.${eventName}`;
  const message = JSON.stringify(payload);
  channel.publish('warehouse_events', routingKey, Buffer.from(message));
  console.log(`Published event: ${routingKey}`);
};

const subscribeToEvents = async (eventName, handler) => {
  if (!channel) {
    await connectRabbitMQ();
  }
  const queue = `warehouse_${eventName}`;
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, 'warehouse_events', `*.${eventName}`);
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg);
    }
  });
};

// Subscribe to relevant events
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

module.exports = {
  publishEvent,
  subscribeToEvents,
};