const Order = require('../models/orderModel');
const { publishEvent } = require('../services/eventService');

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, notes } = req.body;
        const customerId = req.user.sub; // From JWT (customer or staff)
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const orderNumber = generateOrderNumber();

        const order = new Order({
            orderNumber,
            customerId,
            items,
            totalAmount,
            shippingAddress, // Includes addressId or full address
            createdBy: req.user.sub,
            notes,
        });

        await order.save();
        publishEvent('sales.order.created', {
            orderId: order._id,
            customerId,
            items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const userId = req.user.sub;
        const userRole = req.user.role; // role in JWT payload (e.g., "Customer")

        let query = {};
        if (status) query.status = status;
        if (userRole === 'customer') query.customerId = userId; // Customers see only their orders

        const orders = await Order.find(query);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const userId = req.user.sub;
        const userRole = req.user.role;
        if (userRole === 'customer' && order.customerId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const userRole = req.user.role;
        if (userRole === 'customer' && status !== 'cancelled') {
            return res.status(403).json({ message: 'Customers can only cancel orders' });
        }
        if (order.status === 'shipped' || order.status === 'delivered') {
            return res.status(400).json({ message: 'Cannot update status after Shipped' });
        }

        order.status = status;
        order.updatedAt = Date.now();
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };