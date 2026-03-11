const express = require('express');
const router = express.Router();

// Memory store for mock orders
const orders = [];

// Get all orders (Admin Panel)
router.get('/', async (req, res) => {
    try {
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

        // Fallbacks for mocking in development if not provided by frontend yet
        const destPhone = phoneNumber || '+1234567890';
        const name = customerName || 'B-Mart Customer';
        const userEmail = email || 'guest@bmart.com';

        const newOrder = {
            id: orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            items: items || [],
            total: total || 0,
            paymentMethod: paymentMethod || 'cod',
            status: 'Processing',
            phoneNumber: destPhone,
            customerName: name,
            email: userEmail,
            createdAt: new Date()
        };

        orders.push(newOrder);

        res.status(201).json({ success: true, order: newOrder, message: "Order placed." });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific order by ID (Order Tracking)
router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get orders by User Email (Active Orders Profile UI)
router.get('/user/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const userOrders = orders.filter(o => o.email === userEmail);
        
        res.status(200).json({ success: true, orders: userOrders });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.params.email}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update order status (Delivery completion)
router.put('/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body; // e.g., 'Delivered'

        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(200).json({ success: true, message: `Status updated to ${status}. (Mock order).` });
        }

        order.status = status;

        res.status(200).json({ success: true, order, message: `Status updated to ${status}.` });

    } catch (error) {
        console.error(`Error updating order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
