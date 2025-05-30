const PickingList = require('../../models/pickingListModel');

exports.handleInventoryReserved = async (message) => {
    try {
        const { orderId, items,  } = message;

        // Create a picking list for the reserved order
        const pickingList = new PickingList({
            orderId,
            orderNumber: `ORD-${orderId}`, // Generate orderNumber based on orderId
            status: 'Pending',
            items: items.map(item => ({
                productId: item.productId,
                sku: item.sku || `SKU-${item.productId}`, // Fallback SKU
                name: item.name || 'Unknown Product', // Fallback name
                quantity: item.quantity,
                picked: 0,
                location: item.location || 'Unknown', // Fallback location
                shippingAddress: item.shippingAddress || 'Not Provided' // Fallback shipping address
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await pickingList.save();
        console.log(`Handled InventoryReserved: Created picking list for order ${orderId}`);
    } catch (err) {
        console.error('Error handling InventoryReserved:', err);
    }
};

exports.handleOrderCancelled = async (message) => {
    try {
        const { orderId } = message;
        const pickingList = await PickingList.findOne({ orderId, status: 'Pending' });

        if (!pickingList) {
            console.log(`No pending picking list found for cancelled order ${orderId}`);
            return;
        }

        pickingList.status = 'Cancelled';
        pickingList.updatedAt = new Date();
        await pickingList.save();

        console.log(`Handled OrderCancelled: Cancelled picking list for order ${orderId}`);
    } catch (err) {
        console.error('Error handling OrderCancelled:', err);
    }
};

