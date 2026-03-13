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
        const { orderId, items, total, paymentMethod, phoneNumber, customerName, email, userId } = req.body;
        const User = require('../models/User');

        let targetEmail = email || 'guest@bmart.com';
        let targetName = customerName || 'B-Mart Customer';

        // If userId is provided, fetch the registered email to ensure accuracy
        if (userId) {
            try {
                const user = await User.findById(userId);
                if (user) {
                    targetEmail = user.email;
                    targetName = user.username;
                    console.log(`Using registered email for invoice: ${targetEmail}`);
                }
            } catch (err) {
                console.error("Error fetching registered user:", err);
            }
        }

        const newOrder = new Order({
            id: orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            items: items || [],
            total: total || 0,
            paymentMethod: paymentMethod || 'cod',
            status: 'Processing',
            phoneNumber: phoneNumber || '',
            userId: userId || null,
            customerName: targetName,
            email: targetEmail,
            createdAt: new Date(),
        });

        await newOrder.save();
        
        // Respond immediately so user doesn't wait for PDF/Email generation
        res.status(201).json({ success: true, order: newOrder, message: "Order placed successfully." });

        // Background Task: Generate PDF & Email
        // Wrap in try-catch to prevent crashing server on background errors
        (async () => {
            try {
                if (newOrder.email) {
                    const { generateInvoicePDF } = require('../utils/pdfGenerator');
                    const { sendInvoiceEmail } = require('../utils/mailer');
                    
                    console.log(`Generating PDF for Order: ${newOrder.id}...`);
                    const pdfBuffer = await generateInvoicePDF(newOrder);
                    
                    console.log(`Sending email to ${newOrder.email}...`);
                    const info = await sendInvoiceEmail(newOrder.email, pdfBuffer, newOrder.id);
                    
                    // Display preview link in terminal for easy testing without an inbox
                    const nodemailer = require('nodemailer');
                    console.log('PDF Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
                }
            } catch (bgErr) {
                console.error("Background Email Task Failed:", bgErr);
            }
        })();

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
