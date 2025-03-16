const amqp = require('amqplib');
require('dotenv').config();

let channel;

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
        const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-';
        const queue = `${queuePrefix}inventory_events`;

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });

        // Bind queue to relevant events
        await channel.bindQueue(queue, exchange, 'sales.order.created'); // From Sales
        await channel.bindQueue(queue, exchange, 'sales.order.cancelled'); // From Sales
        await channel.bindQueue(queue, exchange, 'warehouse.order.packed'); // From Warehouse

        console.log('RabbitMQ Connected for Inventory Service');
        console.log(`Queue ${queue} bound to ${exchange} with routing keys 'sales.order.*', 'warehouse.order.packed'`);
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
        throw error;
    }
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
    const queue = `${process.env.RABBITMQ_QUEUE_PREFIX || 'smart-chain-'}inventory_events`;

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

module.exports = { connectRabbitMQ, publishEvent, subscribeToEvents };