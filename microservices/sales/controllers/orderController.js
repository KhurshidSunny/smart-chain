const Order = require('../models/orderModel');
const CatalogProduct = require('../models/catalogProductModel');
const { publishOrderCreated } = require('./events/eventHandlerController');
const { commitDomainAndOutbox } = require('../services/eventService');
const { priceOrder, OrderPricingError } = require('../services/orderPricing');

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, notes } = req.body;
        const customerId = req.user.sub; // From JWT
        const productIds = [...new Set(items.map((item) => String(item.productId)))];
        const products = await CatalogProduct.find({ _id: { $in: productIds } }).lean();
        const productsById = new Map(products.map((product) => [String(product._id), product]));
        const priced = priceOrder(items, productsById);
        const orderNumber = generateOrderNumber();

        const order = new Order({
            orderNumber,
            customerId,
            items: priced.items,
            totalAmount: priced.totalAmount,
            shippingAddress,
            createdBy: req.user.sub,
            notes,
        });

        await commitDomainAndOutbox(async (session) => {
            await order.save({ session });
            await publishOrderCreated(order, session);
        });
        res.status(201).json(order);
    } catch (error) {
        if (error instanceof OrderPricingError) {
            return res.status(400).json({ message: error.message });
        }
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
        if (order.status === 'shipping' || order.status === 'delivered') {
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