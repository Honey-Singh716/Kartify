const Cart = require('../models/Cart');

// GET /api/cart — returns all groups, each populated with shop name and product details
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('groups.shop', 'name')
            .populate('groups.items.product');
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, groups: [] });
        }
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/cart — replace entire cart with { groups: [{ shop, items: [{product, quantity, ...}] }] }
const updateCart = async (req, res) => {
    try {
        const { groups } = req.body; // array of { shop: shopId, items: [...] }
        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { groups: groups || [] },
            { new: true, upsert: true }
        )
            .populate('groups.shop', 'name')
            .populate('groups.items.product');
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user._id });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCart, updateCart, clearCart };
