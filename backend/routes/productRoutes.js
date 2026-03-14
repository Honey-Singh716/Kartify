const express = require('express');
const router = express.Router();
const {
    createProduct, getAllProducts, getProductById,
    getMyProducts, updateProduct, deleteProduct,
    addProductReview, getProductReviews
} = require('../controllers/productController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `product-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

router.get('/', getAllProducts);
router.get('/my-products', protect, sellerOnly, getMyProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);
router.post('/', protect, sellerOnly, upload.any(), createProduct);
router.put('/:id', protect, sellerOnly, upload.any(), updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);
router.post('/:id/reviews', protect, addProductReview);

module.exports = router;
