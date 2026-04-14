const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
    try {
        let { shop_id, items, deliveryType, totalAmount, paymentMethod,
            delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode } = req.body;

        // If shop_id is missing, resolve it from the first product in the order
        if (!shop_id && items && items.length > 0) {
            const firstProduct = await Product.findById(items[0].product_id).select('shop');
            if (firstProduct?.shop) {
                shop_id = firstProduct.shop;
                console.log('[Order] Recovered shop_id from product:', shop_id);
            }
        }

        if (!shop_id) {
            return res.status(400).json({ message: 'Could not determine shop for this order. Please clear your cart and try again.' });
        }

        // ✅ Atomic Stock Check and Reduction (Race-Condition Safe)
        // Uses a single MongoDB findOneAndUpdate so the check + decrement
        // happen atomically — no two concurrent requests can both pass.
        for (const item of items) {
            // Verify product exists first
            const exists = await Product.findById(item.product_id).select('_id name');
            if (!exists) return res.status(404).json({ message: `Product ${item.name} not found` });

            if (item.variant_id) {
                // Atomic variant stock decrement — condition is inside the query filter
                const updated = await Product.findOneAndUpdate(
                    {
                        _id: item.product_id,
                        variants: {
                            $elemMatch: {
                                _id: item.variant_id,
                                stock: { $gte: item.quantity }
                            }
                        }
                    },
                    { $inc: { "variants.$.stock": -item.quantity } },
                    { new: true }
                );
                if (!updated) {
                    return res.status(400).json({ message: `Insufficient stock for ${item.name} (${item.color})` });
                }
            } else {
                // Atomic base stock decrement — condition is inside the query filter
                const updated = await Product.findOneAndUpdate(
                    { _id: item.product_id, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
                if (!updated) {
                    return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
                }
            }
        }

        const order = await Order.create({
            customer: req.user._id,
            shop: shop_id,
            items: items.map(i => ({ ...i, product_id: i.product_id })),
            deliveryType,
            totalAmount,
            paymentMethod: paymentMethod || 'Cash',
            delivery_name,
            delivery_phone,
            delivery_address,
            delivery_city,
            delivery_pincode
        });

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyPickup = async (req, res) => {
    try {
        const { pickupCode, confirm } = req.body;

        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOne({ pickupCode, shop: shop._id })
            .populate('customer', 'name email phone');

        if (!order) {
            return res.status(404).json({ message: 'Invalid pickup code for this shop' });
        }

        if (confirm) {
            order.orderStatus = 'picked_up';
            order.pickupVerified = true;
            await order.save();
            return res.json({ message: 'Pickup verified successfully!', order });
        }

        // Return order preview for verification
        res.json({
            message: 'Order found',
            order: {
                _id: order._id,
                customerName: order.customer?.name,
                items: order.items,
                totalAmount: order.totalAmount,
                orderStatus: order.orderStatus
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        // Customers only see their own orders
        const orders = await Order.find({ customer: req.user._id })
            .populate('shop', 'name city')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getShopOrders = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        // Sellers only see orders for their own shop
        const orders = await Order.find({ shop: shop._id })
            .populate('customer', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOne({ _id: req.params.id, shop: shop._id });
        if (!order) return res.status(404).json({ message: 'Order not found or access denied' });

        const { status, estimatedDelivery, statusNote } = req.body;
        if (!status && !estimatedDelivery && !statusNote) {
            return res.status(400).json({ message: 'Status, estimatedDelivery, or statusNote is required' });
        }

        // Validate state transitions if status is being changed
        if (status && status !== order.orderStatus) {
            const currentStatus = order.orderStatus;
            const deliveryType = order.deliveryType;

            // Define valid transitions
            const validTransitions = {
                'pickup': {
                    'pending': ['confirmed', 'cancelled'],
                    'confirmed': ['ready_for_pickup', 'cancelled'],
                    'ready_for_pickup': ['picked_up', 'cancelled'],
                    'picked_up': ['completed'],
                    'completed': [],
                    'cancelled': []
                },
                'delivery': {
                    'pending': ['confirmed', 'cancelled'],
                    'confirmed': ['out_for_delivery', 'cancelled'],
                    'out_for_delivery': ['delivered', 'cancelled'],
                    'delivered': ['completed'],
                    'completed': [],
                    'cancelled': []
                }
            };

            const allowedTransitions = validTransitions[deliveryType]?.[currentStatus] || [];
            if (!allowedTransitions.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status transition from '${currentStatus}' to '${status}' for a ${deliveryType} order`
                });
            }
            order.orderStatus = status;
        }

        // Update other fields if provided
        if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
        if (statusNote !== undefined) order.statusNote = statusNote;

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('shop', 'name city address')
            .populate('customer', 'name email');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Authorization check: User must be the customer or the shop owner
        const isCustomer = order.customer._id.toString() === req.user._id.toString();
        const shop = await Shop.findOne({ _id: order.shop._id, owner: req.user._id });

        if (!isCustomer && !shop) {
            return res.status(403).json({ message: 'Forbidden: Access denied to this order' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateDeliveryTime = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOne({ _id: req.params.id, shop: shop._id });
        if (!order) return res.status(404).json({ message: 'Order not found or access denied' });

        const { estimatedDelivery, statusNote } = req.body;

        if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
        if (statusNote !== undefined) order.statusNote = statusNote;

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Unified PATCH handler — accepts any combination of { status, estimatedDelivery, statusNote }
const updateOrder = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'No shop found' });

        const order = await Order.findOne({ _id: req.params.id, shop: shop._id });
        if (!order) return res.status(404).json({ message: 'Order not found or access denied' });

        const { status, estimatedDelivery, statusNote } = req.body;

        if (!status && estimatedDelivery === undefined && statusNote === undefined) {
            return res.status(400).json({ message: 'At least one of status, estimatedDelivery, or statusNote is required' });
        }

        // Validate and apply status transition if requested
        if (status && status !== order.orderStatus) {
            const currentStatus = order.orderStatus;
            const deliveryType = order.deliveryType;

            const validTransitions = {
                'pickup': {
                    'pending': ['confirmed', 'cancelled'],
                    'confirmed': ['ready_for_pickup', 'cancelled'],
                    'ready_for_pickup': ['picked_up', 'cancelled'],
                    'picked_up': ['completed'],
                    'completed': [],
                    'cancelled': []
                },
                'delivery': {
                    'pending': ['confirmed', 'cancelled'],
                    'confirmed': ['out_for_delivery', 'cancelled'],
                    'out_for_delivery': ['delivered', 'cancelled'],
                    'delivered': ['completed'],
                    'completed': [],
                    'cancelled': []
                }
            };

            const allowedTransitions = validTransitions[deliveryType]?.[currentStatus] || [];
            if (!allowedTransitions.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status transition from '${currentStatus}' to '${status}' for a ${deliveryType} order`
                });
            }
            order.orderStatus = status;
        }

        // Apply ETA and note updates
        if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery || null;
        if (statusNote !== undefined) order.statusNote = statusNote;

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus, getOrderById, verifyPickup, updateDeliveryTime, updateOrder };
