const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
    phone: { type: String },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    openingHours: { type: String, default: '9:00 AM - 9:00 PM' },
    deliveryAvailable: { type: Boolean, default: true },
    pickupAvailable: { type: Boolean, default: true },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

shopSchema.index({ 'location.lat': 1, 'location.lng': 1 }, { sparse: true });
shopSchema.index({ owner: 1 });

module.exports = mongoose.model('Shop', shopSchema);
