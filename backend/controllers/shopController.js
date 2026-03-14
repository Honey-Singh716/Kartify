const Shop = require('../models/Shop');
const Review = require('../models/Review');

const createShop = async (req, res) => {
    try {
        const existing = await Shop.findOne({ seller_id: req.user._id });
        if (existing) return res.status(400).json({ message: 'You already have a shop', shop: existing });

        const shop = await Shop.create({ ...req.body, seller_id: req.user._id });
        res.status(201).json(shop);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllShops = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const shops = await Shop.find(filter).populate('seller_id', 'name email');
        res.json(shops);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate('seller_id', 'name email');
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ seller_id: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateShop = async (req, res) => {
    try {
        const shop = await Shop.findOneAndUpdate(
            { seller_id: req.user._id },
            req.body,
            { new: true }
        );
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShopReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ shop_id: req.params.id })
            .populate('user_id', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addShopReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.create({
            user_id: req.user._id,
            shop_id: req.params.id,
            rating,
            comment,
            userName: req.user.name
        });
        // Update shop rating
        const reviews = await Review.find({ shop_id: req.params.id });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        await Shop.findByIdAndUpdate(req.params.id, { rating: avgRating, totalReviews: reviews.length });
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createShop, getAllShops, getShopById, getMyShop, updateShop, getShopReviews, addShopReview };
