const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variant_id: { type: String }, // ID of the specific variant
    color: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
});

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: [orderItemSchema],
    deliveryType: { type: String, enum: ['delivery', 'pickup'], required: true },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    // Home delivery fields
    delivery_name: String,
    delivery_phone: String,
    delivery_address: String,
    delivery_city: String,
    delivery_pincode: String,
    // Pickup fields
    pickupCode: { type: String },
    pickupVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

orderSchema.index({ customer: 1 });
orderSchema.index({ shop: 1 });

orderSchema.pre('save', function (next) {
    if (this.deliveryType === 'pickup' && !this.pickupCode) {
        this.pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
