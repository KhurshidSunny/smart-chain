const Order = require('../../models/orderModel');
const { publishEvent, read, save } = require('../../services/eventService');
const QRCode = require('qrcode');

exports.publishOrderCreated = async (order) => {
  await publishEvent('sales.order.created', {
    orderId: order._id,
    customerId: order.customerId,
    items: order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      shippingAddress: order.shippingAddress,
    })),
  });
  console.log(`Published OrderCreated for order ${order._id}`);
};

exports.handleInventoryReserved = async (message, envelope, session) => {
  const { orderId } = message;
  const order = await read(Order.findById(orderId), session);
  if (!order) {
    console.warn(`Order ${orderId} not found`);
    return;
  }

  const qrCodeData = await QRCode.toString(order._id.toString(), { type: 'utf8' });
  order.qrCode = qrCodeData;
  order.status = 'confirmed';
  order.updatedAt = Date.now();
  await save(order, session);
  console.log(`Order ${orderId} status updated to Confirmed`);
};

exports.handleOrderPacked = async (message, envelope, session) => {
  const { orderId } = message;
  const order = await read(Order.findById(orderId), session);
  if (!order) {
    console.warn(`Order ${orderId} not found`);
    return;
  }

  order.status = 'packed';
  order.updatedAt = Date.now();
  await save(order, session);
  console.log(`Order ${orderId} status updated to Packed`);
};

exports.handleShipmentShipping = async (message, envelope, session) => {
  const { orderId } = message;
  const order = await read(Order.findById(orderId), session);
  if (!order) {
    console.warn(`Order ${orderId} not found`);
    return;
  }

  order.status = 'shipping';
  order.updatedAt = Date.now();
  await save(order, session);
  console.log(`Order ${orderId} status updated to Shipped`);
};

exports.handleOrderDelivered = async (message, envelope, session) => {
  const { orderId } = message;
  const order = await read(Order.findById(orderId), session);
  if (!order) {
    console.warn(`Order ${orderId} not found`);
    return;
  }

  order.status = 'delivered';
  order.updatedAt = Date.now();
  await save(order, session);
  console.log(`Order ${orderId} status updated to Delivered `);
};
