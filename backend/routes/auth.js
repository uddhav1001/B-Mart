const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Register Route
router.post('/register', async (req, res) => {
    let { username, email, password, name, phone, pincode, address } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Auto-generate username if not provided
        if (!username && name) {
            const baseUsername = name.toLowerCase().replace(/\s+/g, '');
            const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit random number
            username = `${baseUsername}${randomSuffix}`;
            
            // Check if generated username exists (though suffix helps avoid this)
            let existingUser = await User.findOne({ username });
            while (existingUser) {
                const newSuffix = Math.floor(1000 + Math.random() * 9000);
                username = `${baseUsername}${newSuffix}`;
                existingUser = await User.findOne({ username });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username: username || `user_${Date.now()}`,
            email,
            password: hashedPassword,
            name,
            phone,
            pincode,
            address,
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, email: user.email, name: user.name, phone: user.phone, pincode: user.pincode, address: user.address } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, email: user.email, name: user.name, phone: user.phone, pincode: user.pincode, address: user.address } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Profile Route
router.put('/profile', async (req, res) => {
    const { userId, name, phone, address, pincode } = req.body;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (pincode) user.pincode = pincode;

        await user.save();

        res.json({ 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                name: user.name, 
                phone: user.phone, 
                address: user.address, 
                pincode: user.pincode 
            } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address.' });
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetLink = `http://localhost:5173/reset-password/${token}`;

        // Send email with the reset link
        const mailOptions = {
            from: `"B-Mart Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔐 B-Mart — Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #f5a623, #f97316); padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🛍️ B-Mart</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Fresh Groceries in 10 mins</p>
                    </div>
                    <div style="padding: 36px 32px;">
                        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Password Reset Request</h2>
                        <p style="color: #555; line-height: 1.6;">Hi <strong>${user.username}</strong>,</p>
                        <p style="color: #555; line-height: 1.6;">We received a request to reset your B-Mart account password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetLink}" style="background: linear-gradient(135deg, #f5a623, #f97316); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reset My Password</a>
                        </div>
                        <p style="color: #888; font-size: 13px; line-height: 1.6;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                        <p style="color: #aaa; font-size: 12px; text-align: center;">B-Mart · Fresh Groceries Delivered</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: `Password reset link sent to ${user.email}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to send email. Please check server email configuration.' });
    }
});

// Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
