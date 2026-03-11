require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bmart';

const MOCK_PRODUCTS = [
    { name: 'Gemini Refined Sunflower Oil', price: 145.00, originalPrice: 160.00, delivery: '8 MINS', image: '/assets/product_gemini_oil_1772433293336.png', unit: '1 L', categoryId: 'cat-oil' },
    { name: 'Gemini Refined Sunflower Oil', price: 720.00, originalPrice: 780.00, delivery: '8 MINS', image: '/assets/product_gemini_oil_1772433293336.png', unit: '5 L', categoryId: 'cat-oil' },
    { name: 'Premium Soyabean Oil', price: 130.00, originalPrice: 145.00, delivery: '8 MINS', image: '/assets/product_soyabean_oil_1772433308863.png', unit: '1 L', categoryId: 'cat-oil' },
    { name: 'Premium Soyabean Oil', price: 620.00, originalPrice: 680.00, delivery: '8 MINS', image: '/assets/product_soyabean_oil_1772433308863.png', unit: '5 L', categoryId: 'cat-oil' },
    { name: 'Crystal Basmati Rice', price: 450.00, originalPrice: 500.00, delivery: '11 MINS', image: '/assets/product_rice_1772431908832.png', unit: '5 kg', categoryId: 'cat-grains' },
    { name: 'Spicy Potato Namkeen Chips', price: 20.00, originalPrice: 20.00, delivery: '5 MINS', image: '/assets/product_chips_1772431926863.png', unit: '100 g', categoryId: 'cat-chips' },
    { name: 'Chai Time Glucose Biscuits', price: 30.00, originalPrice: 35.00, delivery: '6 MINS', image: '/assets/product_biscuits_1772431968087.png', unit: '200 g', categoryId: 'cat-biscuits' },
    { name: 'Natural Sandalwood Bath Soap', price: 45.00, originalPrice: 55.00, delivery: '10 MINS', image: '/assets/product_soap_1772431993269.png', unit: '125 g', categoryId: 'cat-soap' },
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected for seeding');
        try {
            await Product.deleteMany({});
            console.log('Cleared existing products');
            await Product.insertMany(MOCK_PRODUCTS);
            console.log('Seeded database with mock products');
            process.exit();
        } catch (e) {
            console.error('Error seeding data', e);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
