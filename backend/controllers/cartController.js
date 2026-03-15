const Cart = require('../models/Cart');

const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product').populate('shop', 'name');
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateCart = async (req, res) => {
    try {
        const { items, shop } = req.body; // Expecting array of { product, quantity } and shopId
        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items, shop },
            { new: true, upsert: true }
        ).populate('items.product').populate('shop', 'name');
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user._id });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCart, updateCart, clearCart };
