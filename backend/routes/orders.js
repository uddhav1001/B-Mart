const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders (Admin Panel)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create a new order (Checkout)
router.post('/', async (req, res) => {
    try {
        const { orderId, items, total, paymentMethod, phoneNumber, customerName, email } = req.body;

        const newOrder = new Order({
            id: orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            items: items || [],
            total: total || 0,
            paymentMethod: paymentMethod || 'cod',
            status: 'Processing',
            phoneNumber: phoneNumber || '',
            customerName: customerName || 'B-Mart Customer',
            email: email || 'guest@bmart.com',
            createdAt: new Date(),
        });

        await newOrder.save();

        res.status(201).json({ success: true, order: newOrder, message: "Order placed successfully." });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get orders by User Email (Order History & Active Orders UI)
// NOTE: Must be defined BEFORE /:id to avoid "user" being treated as an id
router.get('/user/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const userOrders = await Order.find({
            email: userEmail,
            createdAt: { $gte: thirtyDaysAgo },
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, orders: userOrders });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.params.email}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific order by ID (Order Tracking)
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update order status (Delivery completion / tracking)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true }
        );

        if (!order) {
            // Gracefully handle mock orders that may not exist in DB
            return res.status(200).json({ success: true, message: `Status updated to ${status}. (Order not found in DB — may be a mock order).` });
        }

        res.status(200).json({ success: true, order, message: `Status updated to ${status}.` });
    } catch (error) {
        console.error(`Error updating order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
