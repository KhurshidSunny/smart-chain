const Order = require('../models/orderModel');
const { publishOrderCreated } = require('./events/eventHandlerController');

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, notes } = req.body;
        const customerId = req.user.sub; // From JWT
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const orderNumber = generateOrderNumber();

        const order = new Order({
            orderNumber,
            customerId,
            items,
            totalAmount,
            shippingAddress,
            createdBy: req.user.sub,
            notes,
        });

        await order.save();
        publishOrderCreated(order); // Event publishing moved to eventHandlerController
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const userId = req.user.sub;
        const userRole = req.user.role;

        let query = {};
        if (status) query.status = status;
        if (userRole === 'customer') query.customerId = userId;

        const orders = await Order.find(query);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
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

exports.updateOrderStatus = async (req, res) => {
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