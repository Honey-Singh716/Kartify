const express = require('express');
const router = express.Router();
const {
    createProduct, getAllProducts, getProductById,
    getMyProducts, updateProduct, deleteProduct,
    addProductReview, getProductReviews, getProductsByShop,
    getProductsByCategory
} = require('../controllers/productController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Storage configuration moved to config/cloudinary.js

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit as per new requirements
});

router.get('/', getAllProducts);
router.get('/my-products', protect, sellerOnly, getMyProducts);
router.get('/shop/:shopId', getProductsByShop);
router.get('/category/:category', getProductsByCategory);
router.get('/:id/reviews', getProductReviews);
router.get('/:id', getProductById);
router.post('/', protect, sellerOnly, upload.any(), createProduct);
router.put('/:id', protect, sellerOnly, upload.any(), updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);
router.post('/:id/reviews', protect, addProductReview);

module.exports = router;
