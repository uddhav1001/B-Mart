const mongoose = require('mongoose');
require('dotenv').config();
const MerchantConfig = require('./models/MerchantConfig');

async function updateConfig() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bmart');
        
        let config = await MerchantConfig.findOne();
        if (!config) config = new MerchantConfig();

        config.upiId = 'uddhavb9561-1@okaxis';
        config.qrCodeUrl = '/uploads/merchant_qr.png';
        config.updatedAt = new Date();
        
        await config.save();
        console.log('Merchant config updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating config:', err);
        process.exit(1);
    }
}

updateConfig();
