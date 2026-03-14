const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
    try {
        const { shop_id, items, deliveryType, total_price,
            delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode } = req.body;

        const order = await Order.create({
            buyer_id: req.user._id,
            shop_id,
            items,
            deliveryType,
            total_price,
            delivery_name,
            delivery_phone,
            delivery_address,
            delivery_city,
            delivery_pincode
        });

        // Reduce stock
        for (const item of items) {
            if (item.variant_id) {
                // Reduce stock for specific variant
                await Product.updateOne(
                    { _id: item.product_id, "variants._id": item.variant_id },
                    { $inc: { "variants.$.stock": -item.quantity } }
                );
            } else {
                // Fallback to global stock if no variant specified
                await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
            }
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyPickup = async (req, res) => {
    try {
        const { pickupCode, confirm } = req.body;

        const shop = await Shop.findOne({ seller_id: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOne({ pickupCode, shop_id: shop._id })
            .populate('buyer_id', 'name email phone');

        if (!order) {
            return res.status(404).json({ message: 'Invalid pickup code for this shop' });
        }

        if (confirm) {
            order.status = 'picked_up';
            order.pickupVerified = true;
            await order.save();
            return res.json({ message: 'Pickup verified successfully!', order });
        }

        // Return order preview for verification
        res.json({
            message: 'Order found',
            order: {
                _id: order._id,
                buyerName: order.buyer_id?.name,
                items: order.items,
                total_price: order.total_price,
                status: order.status
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer_id: req.user._id })
            .populate('shop_id', 'name city')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShopOrders = async (req, res) => {
    try {
        const shop = await Shop.findOne({ seller_id: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });
        const orders = await Order.find({ shop_id: shop._id })
            .populate('buyer_id', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const shop = await Shop.findOne({ seller_id: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, shop_id: shop._id },
            { status: req.body.status },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found or access denied' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('shop_id', 'name city address')
            .populate('buyer_id', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus, getOrderById, verifyPickup };
