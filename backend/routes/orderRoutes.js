const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getShopOrders, updateOrderStatus, getOrderById, verifyPickup } = require('../controllers/orderController');
const { protect, sellerOnly, customerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, customerOnly, createOrder);
router.post('/verify-pickup', protect, sellerOnly, verifyPickup);
router.get('/my-orders', protect, customerOnly, getMyOrders);
router.get('/shop-orders', protect, sellerOnly, getShopOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, sellerOnly, updateOrderStatus);

module.exports = router;
