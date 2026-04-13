const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getShopOrders, updateOrderStatus, getOrderById, verifyPickup, updateDeliveryTime, updateOrder } = require('../controllers/orderController');
const { protect, sellerOnly, customerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, customerOnly, createOrder);
router.post('/verify-pickup', protect, sellerOnly, verifyPickup);
router.get('/my-orders', protect, customerOnly, getMyOrders);
router.get('/shop-orders', protect, sellerOnly, getShopOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, sellerOnly, updateOrderStatus);
router.patch('/:id/delivery-time', protect, sellerOnly, updateDeliveryTime);
router.patch('/:id', protect, sellerOnly, updateOrder); // Unified endpoint

module.exports = router;

