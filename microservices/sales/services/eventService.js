// Import the 'amqplib' library, which is a Node.js client for RabbitMQ.
// This allows us to connect to RabbitMQ, create channels, and send/receive messages.
const amqp = require('amqplib');

require('dotenv').config();

// Declare a variable to hold the RabbitMQ channel, which we'll use to send and receive messages.
// It's defined outside the functions so it can be shared across the module (a singleton pattern).
// Initially null; we'll set it when we connect.
let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    // Create a channel on the connection. A channel is a lightweight "session" over the connection
    // where we perform operations like publishing messages or creating queues.
    // We store it in the 'channel' variable so it can be reused across the app.
    channel = await connection.createChannel();

    // Define the exchange name
    // An exchange is like a "router" that directs messages to queues based on routing keys.
    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';

    // Queues hold messages until they're consumed. The prefix (e.g., 'smart-chain-') helps organize
    // queues by app name, avoiding conflicts if multiple apps use the same RabbitMQ instance.
    const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';

    // Construct the queue name by combining the prefix with a service-specific part.
    // Here, 'sales_events' indicates this queue is for sales-related events.
    // Result might be 'smart-chain-sales_events', making it clear and unique.
    const queue = `${queuePrefix}sales_events`;

    // Assert (create or verify) the exchange exists with type 'topic'.
    // 'topic' exchanges route messages to queues based on pattern matching (e.g., 'sales.order.*').
    // { durable: true } means the exchange survives RabbitMQ restarts, ensuring reliability.
    await channel.assertExchange(exchange, 'topic', { durable: true });

    // Assert (create or verify) the queue exists.
    // Queues store messages until a consumer processes them. 'durable: true' ensures the queue
    await channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with a routing key pattern 'sales.order.*'.
    // This tells RabbitMQ: "Send messages with routing keys like 'sales.order.created' or
    // 'sales.order.updated' to this queue." The '*' is a wildcard for one word.
    // This setup allows the sales service to listen for all order-related events.
    await channel.bindQueue(queue, exchange, 'inventory.reserved');
    await channel.bindQueue(queue, exchange, 'warehouse.order.packed');
    await channel.bindQueue(queue, exchange, 'logistics.shipment.dispatched');
    await channel.bindQueue(queue, exchange, 'logistics.order.delivered');

    // Log the binding details for clarity. This shows what queue is listening to what exchange
    // and with which routing key pattern, making it easier to troubleshoot message flow.
    console.log('RabbitMQ Connected for Sales Service');
    console.log(`Queue ${queue} bound to ${exchange} with routing keys: inventory.reserved, warehouse.order.packed, logistics.shipment.*, logistics.order.delivered`);

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

// Define a function to publish events (messages) to RabbitMQ.
// Takes a routingKey (e.g., 'sales.order.created') and a message (e.g., { orderId: '123' }).
const publishEvent = (routingKey, message) => {
  // Check if the channel is initialized. If not, throw an error to prevent silent failures.
  // This ensures connectRabbitMQ() has been called successfully before publishing.
  if (!channel) throw new Error('RabbitMQ channel not initialized');

  // Reuse the same exchange name as in connectRabbitMQ, pulled from .env or fallback.
  // Consistency is key—messages must go to the same exchange the queue is bound to.
  const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';

  // Convert the message (a JavaScript object) to a JSON string, then to a Buffer.
  // RabbitMQ expects messages as Buffers (binary data), not plain objects.
  // JSON.stringify ensures the message is in a standard format other services can parse.
  const msgBuffer = Buffer.from(JSON.stringify(message));

  // Publish the message to the exchange with the specified routing key.
  // The exchange will route it to any queue bound with a matching pattern (e.g., 'sales.order.*').
  // This is fire-and-forget—RabbitMQ handles delivery to consumers.
  channel.publish(exchange, routingKey, msgBuffer);

  // Log the event for debugging. Shows what was sent and where, helping trace message flow.
  // In development, this confirms the event was published; in production, you might disable it.
  console.log(`Event Published: ${routingKey}`, message);
};


const subscribeToEvents = (eventHandlers) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}sales_events`;

  channel.consume(queue, (msg) => {
    if (msg !== null) {
      const routingKey = msg.fields.routingKey;
      const message = JSON.parse(msg.content.toString());
      const handler = eventHandlers[routingKey];
      console.log(routingKey, message);

      if (handler) {
        handler(message);
        channel.ack(msg);
      } else {
        console.warn(`No handler for routing key: ${routingKey}`);
        channel.nack(msg, false, true);
      }
    }
  }, { noAck: false });

  console.log(`Subscribed to events on queue ${queue}`);
};

// Export the two functions so other parts of the sales service (e.g., orderController.js)
// can use them to connect to RabbitMQ and publish events like 'OrderCreated'.
module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents };