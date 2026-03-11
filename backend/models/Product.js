const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    originalPrice: {
        type: Number,
    },
    delivery: {
        type: String,
        default: '10 MINS',
    },
    image: {
        type: String,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    categoryId: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
