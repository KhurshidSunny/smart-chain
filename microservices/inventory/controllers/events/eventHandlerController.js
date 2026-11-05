const Product = require('../../models/productModel');
const Reservation = require('../../models/reservationModel');
const InventoryTransaction = require('../../models/inventoryTransactionModel');
const { publishEvent, followFrom, read, save } = require('../../services/eventService');

exports.handleOrderCreated = async (message, envelope, session) => {
  const { orderId, items, customerId } = message;
  const trace = followFrom(envelope);

  for (const item of items) {
    const product = await read(Product.findById(item.productId), session);
    if (!product || product.stockLevel < item.quantity) {
      console.error(`Insufficient stock for product ${item.productId} in order ${orderId}`);
      return;
    }
  }

  const reservation = new Reservation({ orderId, items });
  await save(reservation, session);

  for (const item of items) {
    const product = await read(Product.findById(item.productId), session);
    product.stockLevel -= item.quantity;
    await save(product, session);

    await save(
      new InventoryTransaction({
        productId: item.productId,
        type: 'reserved',
        quantity: item.quantity,
        orderId,
        performedBy: customerId,
      }),
      session
    );

    if (product.stockLevel <= product.reorderPoint) {
      await publishEvent(
        'inventory.low_stock',
        {
          productId: product._id,
          currentLevel: product.stockLevel,
          reorderPoint: product.reorderPoint,
        },
        trace
      );
    }
  }

  await publishEvent(
    'inventory.reserved',
    { orderId, reservationId: reservation._id, items },
    trace
  );
  console.log(`Handled OrderCreated for order ${orderId}`);
};

exports.handleOrderCancelled = async (message, envelope, session) => {
  const { orderId } = message;
  const reservation = await read(Reservation.findOne({ orderId, status: 'reserved' }), session);
  if (!reservation) return;

  for (const item of reservation.items) {
    const product = await read(Product.findById(item.productId), session);
    product.stockLevel += item.quantity;
    await save(product, session);

    await save(
      new InventoryTransaction({
        productId: item.productId,
        type: 'released',
        quantity: item.quantity,
        orderId,
        performedBy: 'system',
      }),
      session
    );
  }

  reservation.status = 'cancelled';
  await save(reservation, session);

  await publishEvent(
    'inventory.released',
    { orderId, items: reservation.items },
    followFrom(envelope)
  );
  console.log(`Handled OrderCancelled for order ${orderId}`);
};

exports.handleOrderPacked = async (message, envelope, session) => {
  const { orderId } = message;
  const reservation = await read(Reservation.findOne({ orderId, status: 'reserved' }), session);
  if (!reservation) return;

  for (const item of reservation.items) {
    await save(
      new InventoryTransaction({
        productId: item.productId,
        type: 'sold',
        quantity: item.quantity,
        orderId,
        performedBy: 'system',
      }),
      session
    );
  }

  reservation.status = 'fulfilled';
  await save(reservation, session);
  console.log(`Handled OrderPacked for order ${orderId}`);
};
