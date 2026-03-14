const mongoose = require('mongoose');

const MerchantConfigSchema = new mongoose.Schema({
    upiId: {
        type: String,
        required: true,
        default: 'bmart@upi'
    },
    qrCodeUrl: {
        type: String,
        required: true,
        default: '/uploads/default_qr.png'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MerchantConfig', MerchantConfigSchema);
