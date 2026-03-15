const express = require('express');
const router = express.Router();
const { addProductReview, getProductReviews } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// User requested GET /api/reviews/:productId and POST /api/reviews/:productId
router.get('/:id', getProductReviews);
router.post('/:id', protect, addProductReview);

module.exports = router;
