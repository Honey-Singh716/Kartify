const express = require('express');
const router = express.Router();
const { createShop, getAllShops, getShopById, getMyShop, updateShop, getShopReviews, addShopReview } = require('../controllers/shopController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

router.get('/', getAllShops);
router.get('/my-shop', protect, sellerOnly, getMyShop);
router.get('/:id', getShopById);
router.get('/:id/reviews', getShopReviews);
router.post('/', protect, sellerOnly, createShop);
router.put('/my-shop', protect, sellerOnly, updateShop);
router.post('/:id/reviews', protect, addShopReview);

module.exports = router;
