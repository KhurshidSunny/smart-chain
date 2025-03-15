// Import the 'amqplib' library, which is a Node.js client for RabbitMQ.
// This allows us to connect to RabbitMQ, create channels, and send/receive messages.
const amqp = require('amqplib');

// Load environment variables from a .env file into process.env using 'dotenv'.
// This is a best practice to keep sensitive data (like RabbitMQ URL) out of the codebase
// and make configuration flexible for different environments (dev, prod, etc.).
require('dotenv').config();

// Declare a variable to hold the RabbitMQ channel, which we'll use to send and receive messages.
// It's defined outside the functions so it can be shared across the module (a singleton pattern).
// Initially null; we'll set it when we connect.
let channel;

// Define an async function to establish a connection to RabbitMQ and set up messaging.
// 'async' is used because connecting and setting up channels involves network calls that return promises.
const connectRabbitMQ = async () => {
  try {
    // Attempt to connect to RabbitMQ using the URL from the environment variable RABBITMQ_URL.
    // process.env.RABBITMQ_URL comes from the .env file (e.g., amqps://user:pass@host/vhost).
    // This makes the connection portable—change the URL in .env, and it works anywhere without code changes.
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    // Create a channel on the connection. A channel is a lightweight "session" over the connection
    // where we perform operations like publishing messages or creating queues.
    // We store it in the 'channel' variable so it can be reused across the app.
    channel = await connection.createChannel();

    // Define the exchange name, pulling it from RABBITMQ_EXCHANGE in .env if set.
    // An exchange is like a "router" that directs messages to queues based on routing keys.
    // Fallback to 'smartchain_exchange' if not specified, ensuring it always works even without .env setup.
    const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';

    // Define a prefix for queue names from RABBITMQ_QUEUE_PREFIX in .env, with a fallback.
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
    // persists through restarts, and messages aren’t lost (if also marked persistent).
    await channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with a routing key pattern 'sales.order.*'.
    // This tells RabbitMQ: "Send messages with routing keys like 'sales.order.created' or
    // 'sales.order.updated' to this queue." The '*' is a wildcard for one word.
    // This setup allows the sales service to listen for all order-related events.
    await channel.bindQueue(queue, exchange, 'sales.order.*');

    // Log a success message to confirm the connection worked.
    // Helpful for debugging during development to know the service is ready to send/receive messages.
    console.log('RabbitMQ Connected for Sales Service');

    // Log the binding details for clarity. This shows what queue is listening to what exchange
    // and with which routing key pattern, making it easier to troubleshoot message flow.
    console.log(`Queue ${queue} bound to ${exchange} with routing key 'sales.order.*'`);
  } catch (error) {
    // If anything fails (e.g., wrong URL, network issue), log the error for debugging.
    // This helps you see what went wrong—like an invalid RABBITMQ_URL or RabbitMQ being down.
    console.error('RabbitMQ Connection Error:', error);

    // Re-throw the error so the caller (e.g., app.js) can handle it, like retrying or shutting down.
    // Without this, the error would be silently swallowed, which could hide problems.
    throw error;
  }
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

// Export the two functions so other parts of the sales service (e.g., orderController.js)
// can use them to connect to RabbitMQ and publish events like 'OrderCreated'.
module.exports = { connectRabbitMQ, publishEvent };