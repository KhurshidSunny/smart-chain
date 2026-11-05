const PickingList = require('../../models/pickingListModel');
const { read, save } = require('../../services/eventService');

exports.handleInventoryReserved = async (message, envelope, session) => {
  const { orderId, items } = message;

  const pickingList = new PickingList({
    orderId,
    orderNumber: `ORD-${orderId}`,
    status: 'Pending',
    items: items.map((item) => ({
      productId: item.productId,
      sku: item.sku || `SKU-${item.productId}`,
      name: item.name || 'Unknown Product',
      quantity: item.quantity,
      picked: 0,
      location: item.location || 'Unknown',
      shippingAddress: item.shippingAddress || 'Not Provided',
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await save(pickingList, session);
  console.log(`Handled InventoryReserved: Created picking list for order ${orderId}`);
};

exports.handleOrderCancelled = async (message, envelope, session) => {
  const { orderId } = message;
  const pickingList = await read(PickingList.findOne({ orderId, status: 'Pending' }), session);

  if (!pickingList) {
    console.log(`No pending picking list found for cancelled order ${orderId}`);
    return;
  }

  pickingList.status = 'Cancelled';
  pickingList.updatedAt = new Date();
  await save(pickingList, session);

  console.log(`Handled OrderCancelled: Cancelled picking list for order ${orderId}`);
};
