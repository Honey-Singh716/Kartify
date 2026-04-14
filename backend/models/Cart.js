const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    variant_id: { type: String },
    color: { type: String },
    price: { type: Number },
    image: { type: String }
});

const cartGroupSchema = new mongoose.Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: [cartItemSchema]
});

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    groups: [cartGroupSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
