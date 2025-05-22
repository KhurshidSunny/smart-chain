require('dotenv').config();
const amqp = require('amqplib');
const Shipment = require('../models/shipmentModel');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        console.log(`Connecting to RabbitMQ at ${process.env.RABBITMQ_URL}`);
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('logistics_events', 'topic', { durable: true });
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('RabbitMQ connection error:', error);
        throw error;
    }
};

const publishEvent = async (eventName, payload) => {
    if (!channel) {
        await connectRabbitMQ();
    }
    const routingKey = `logistics.${eventName}`;
    const message = JSON.stringify(payload);
    channel.publish('logistics_events', routingKey, Buffer.from(message));
    console.log(`Published event: ${routingKey}`);
};

const subscribeToEvents = async (eventName, handler) => {
    if (!channel) {
        await connectRabbitMQ();
    }
    const queue = `logistics_${eventName}`;
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'logistics_events', `*.${eventName}`);
    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const payload = JSON.parse(msg.content.toString());
            await handler(payload);
            channel.ack(msg);
        }
    });
};

module.exports = {
    publishEvent,
    subscribeToEvents,
    connectRabbitMQ
};

const initSubscriptions = () => {
    subscribeToEvents('OrderPacked', async (payload) => {
        const { orderId, packageId, qrCode, dimensions } = payload;
        const shipment = new Shipment({
            orderId,
            orderNumber: `ORD-${orderId}`,
            packageId,
            qrCode,
            trackingNumber: `TRK-${Date.now()}-${orderId}`,
            carrier: 'DefaultCarrier',
            serviceLevel: 'Standard',
            status: 'Created',
            deliveryAddress: {
                street: 'TBD', // Will be updated via API or order data
                city: 'TBD',
                state: 'TBD',
                zipCode: 'TBD',
                country: 'TBD'
            },
            cost: 0, // Will be calculated later
        });
        await shipment.save();
        await publishEvent('ShipmentCreated', {
            shipmentId: shipment._id,
            orderId,
            packageId
        });
    });

    subscribeToEvents('QRCodeScanned', async (payload) => {
        const { code, entityType, entityId, location, scannedBy } = payload;
        if (entityType === 'Shipment') {
            const shipment = await Shipment.findById(entityId);
            if (shipment && shipment.qrCode === code) {
                const trackingEvent = {
                    shipmentId: entityId,
                    status: shipment.status === 'Dispatched' ? 'InTransit' : 'OutForDelivery',
                    location,
                    timestamp: new Date(),
                };
                await require('../models/trackingEventModel').create(trackingEvent);
                shipment.status = trackingEvent.status;
                await shipment.save();
                await publishEvent('TrackingUpdated', {
                    shipmentId: entityId,
                    orderId: shipment.orderId,
                    status: trackingEvent.status,
                    location
                });
            }
        }
    });
};

module.exports.initSubscriptions = initSubscriptions;