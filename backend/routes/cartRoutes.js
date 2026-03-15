const express = require('express');
const router = express.Router();
const { getCart, updateCart, clearCart } = require('../controllers/cartController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.get('/', protect, customerOnly, getCart);
router.post('/', protect, customerOnly, updateCart);
router.delete('/', protect, customerOnly, clearCart);

module.exports = router;
