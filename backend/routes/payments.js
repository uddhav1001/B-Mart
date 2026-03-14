const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const Order = require('../models/Order');
const MerchantConfig = require('../models/MerchantConfig');

// Configure Multer for screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images!"));
    }
});

/**
 * Verify UPI Payment Flow
 * POST /api/payments/verify-upi
 */
router.post('/verify-upi', upload.single('screenshot'), async (req, res) => {
    try {
        const { orderId, transactionId, amount } = req.body;
        const screenshot = req.file;

        if (!screenshot) {
            return res.status(400).json({ success: false, message: 'Screenshot is required.' });
        }

        // 1. Check for duplicate Transaction ID
        const existingOrder = await Order.findOne({ transactionId });
        if (existingOrder) {
            return res.status(400).json({ success: false, message: 'This Transaction ID has already been used.' });
        }

        // 2. Perform OCR on the screenshot
        console.log(`Starting OCR for order ${orderId}, transaction ${transactionId}...`);
        const { data: { text } } = await Tesseract.recognize(
            screenshot.path,
            'eng',
            { logger: m => console.log(m) }
        );

        console.log("Extracted Text:", text);

        // 3. Simple Verification Logic
        // Normalize text: remove spaces, lowercase
        const normalizedText = text.replace(/\s+/g, '').toLowerCase();
        const normalizedUTR = transactionId.replace(/\s+/g, '').toLowerCase();
        
        // Check if UTR is in the text
        const utrMatch = normalizedText.includes(normalizedUTR);
        
        // Check if amount is in the text (approximate match)
        // We'll look for the amount string like "147.00" or "147"
        const amountStr = parseFloat(amount).toFixed(2);
        const amountMatch = normalizedText.includes(amountStr.replace('.', '')) || 
                           normalizedText.includes(Math.floor(amount).toString());

        if (utrMatch && amountMatch) {
            // Update Order as Verified
            const order = await Order.findOneAndUpdate(
                { id: orderId },
                { 
                    transactionId, 
                    screenshotUrl: screenshot.path, 
                    paymentVerified: true,
                    status: 'Paid'
                },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found in database.' });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Payment verified successfully!', 
                order 
            });
        } else {
            // Log the failure details
            console.error(`Verification Failed: UTR Match=${utrMatch}, Amount Match=${amountMatch}`);
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed. Please ensure the screenshot clearly shows the UTR and Amount.',
                details: { utrMatch, amountMatch }
            });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: 'Internal server error during verification.' });
    }
});

/**
 * Get Merchant Config (UPI ID, QR)
 * GET /api/payments/config
 */
router.get('/config', async (req, res) => {
    try {
        let config = await MerchantConfig.findOne();
        if (!config) {
            // Create default if none exists
            config = new MerchantConfig();
            await config.save();
        }
        res.status(200).json({ success: true, config });
    } catch (error) {
        console.error("Error fetching config:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Update Merchant Config
 * POST /api/payments/config-merchant
 */
router.post('/config-merchant', upload.single('qrCode'), async (req, res) => {
    try {
        const { upiId } = req.body;
        const qrFile = req.file;

        let config = await MerchantConfig.findOne();
        if (!config) config = new MerchantConfig();

        if (upiId) config.upiId = upiId;
        if (qrFile) config.qrCodeUrl = `/uploads/${qrFile.filename}`;
        
        config.updatedAt = new Date();
        await config.save();

        res.status(200).json({ success: true, message: 'Merchant config updated.', config });
    } catch (error) {
        console.error("Error updating config:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
