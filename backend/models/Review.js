const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    userName: { type: String },
    createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ shop: 1 }, { background: true });
reviewSchema.index({ product: 1 }, { background: true });

module.exports = mongoose.model('Review', reviewSchema);
