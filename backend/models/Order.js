const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    items: {
        type: Array,
        default: [],
    },
    total: {
        type: Number,
        default: 0,
    },
    paymentMethod: {
        type: String,
        default: 'cod',
    },
    status: {
        type: String,
        default: 'Processing',
    },
    phoneNumber: {
        type: String,
        default: '',
    },
    customerName: {
        type: String,
        default: 'B-Mart Customer',
    },
    email: {
        type: String,
        required: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // TTL index: MongoDB auto-deletes documents 30 days after createdAt
        expires: 60 * 60 * 24 * 30, // 2592000 seconds = 30 days
    },
});

module.exports = mongoose.model('Order', OrderSchema);
