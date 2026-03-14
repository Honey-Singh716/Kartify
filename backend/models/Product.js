const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: { type: String, required: true },
    images: [{ type: String }],
    variants: [{
        color: { type: String, required: true },
        image: { type: String },
        stock: { type: Number, default: 0 }
    }],
    features: [{ type: String }],
    specifications: { type: Object },
    medicalInfo: { type: Object },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
