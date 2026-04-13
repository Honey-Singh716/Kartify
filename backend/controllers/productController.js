const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Review = require('../models/Review');

// Convert any non-object specifications (e.g. accidental string) to a proper object
const sanitizeProductSpecs = (product) => {
    const obj = product.toObject ? product.toObject() : { ...product };
    if (obj.specifications && typeof obj.specifications !== 'object') {
        const specs = {};
        String(obj.specifications).split(/[,\n]+/).forEach(part => {
            const idx = part.indexOf(':');
            if (idx > 0) {
                const k = part.slice(0, idx).trim();
                const v = part.slice(idx + 1).trim();
                if (k && isNaN(Number(k))) specs[k] = v;
            }
        });
        obj.specifications = specs;
    }
    return obj;
};


const parseSpecifications = (body) => {
    const specs = {};
    Object.keys(body).forEach(key => {
        const match = key.match(/^specifications\[(.+)\]$/);
        if (match) {
            specs[match[1]] = body[key];
        } else if (key === 'specifications' && typeof body[key] === 'object') {
            Object.assign(specs, body[key]);
        }
    });
    return Object.keys(specs).length > 0 ? specs : (body.specifications && typeof body.specifications === 'object' ? body.specifications : {});
};

const parseMedicalInfo = (body) => {
    const info = {};
    Object.keys(body).forEach(key => {
        const match = key.match(/^medicalInfo\[(.+)\]$/);
        if (match) {
            info[match[1]] = body[key];
        } else if (key === 'medicalInfo' && typeof body[key] === 'object') {
            Object.assign(info, body[key]);
        }
    });
    return Object.keys(info).length > 0 ? info : (body.medicalInfo && typeof body.medicalInfo === 'object' ? body.medicalInfo : {});
};

const parseVariants = (body, files) => {
    const variants = [];
    const variantKeys = Object.keys(body).filter(k => k.startsWith('variants['));

    // Safely extract indexes
    const indexes = [...new Set(variantKeys.map(k => {
        const m = k.match(/\[(\d+)\]/);
        return m ? m[1] : null;
    }).filter(x => x !== null))];

    indexes.forEach(i => {
        const variant = {
            color: body[`variants[${i}][color]`],
            stock: Number(body[`variants[${i}][stock]`]) || 0,
            image: body[`variants[${i}][image]`]
        };

        const file = files?.find(f => f.fieldname === `variant_image_${i}`);
        if (file) {
            variant.image = file.path; // Cloudinary URL
        }

        if (variant.color) variants.push(variant);
    });

    // Cleanup multipart body noise
    variantKeys.forEach(k => delete body[k]);
    Object.keys(body).filter(k => k.startsWith('specifications[') || k.startsWith('medicalInfo[')).forEach(k => delete body[k]);

    return variants;
};

const createProduct = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) return res.status(404).json({ message: 'Create a shop first' });

        const specifications = parseSpecifications(req.body);
        const medicalInfo = parseMedicalInfo(req.body);
        const variants = parseVariants(req.body, req.files);

        const productData = {
            ...req.body,
            shop: shop._id,
            seller: req.user._id,
            specifications,
            medicalInfo,
            variants
        };

        const mainImage = req.files?.find(f => f.fieldname === 'image');
        if (mainImage) {
            productData.images = [mainImage.path]; // Cloudinary URL
        } else if (productData.variants.length > 0 && productData.variants[0].image) {
            productData.images = [productData.variants[0].image];
        }

        if (req.body['features[]']) {
            productData.features = Array.isArray(req.body['features[]']) ? req.body['features[]'] : [req.body['features[]']];
        }

        const product = await Product.create(productData);
        console.log("Product created. ShopId:", shop._id);
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = {};
        if (search) filter.name = { $regex: search, $options: 'i' };

        const products = await Product.find(filter).populate('shop');

        console.log("Products found (homepage/search):", products.length);
        res.json(products.map(sanitizeProductSpecs));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('shop', 'name city address phone location');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(sanitizeProductSpecs(product));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id }).populate('shop');
        console.log("SellerId:", req.user._id);
        console.log("Products found (my-products):", products.length);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        // Enforce ownership: seller must be the one who created it
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found or access denied' });

        const specifications = parseSpecifications(req.body);
        const medicalInfo = parseMedicalInfo(req.body);
        const variants = parseVariants(req.body, req.files);

        const updateData = {
            ...req.body,
            specifications,
            medicalInfo,
            variants,
            // Force linkage preservation
            shop: product.shop,
            seller: req.user._id
        };

        const mainFile = req.files?.find(f => f.fieldname === 'image');
        if (mainFile) {
            updateData.images = [mainFile.path]; // Cloudinary URL
        } else if (updateData.variants.length > 0 && updateData.variants[0].image && (!product.images || product.images.length === 0)) {
            updateData.images = [updateData.variants[0].image];
        } else {
            delete updateData.images;
        }

        if (req.body['features[]']) {
            updateData.features = Array.isArray(req.body['features[]']) ? req.body['features[]'] : [req.body['features[]']];
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        console.log("Product updated for shop:", product.shop);
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found or access denied' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const { rating, comment } = req.body;
        const review = await Review.create({
            user: req.user._id,
            product: product._id,
            shop: product.shop,
            rating,
            comment,
            userName: req.user.name
        });
        const reviews = await Review.find({ product: req.params.id });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        await Product.findByIdAndUpdate(req.params.id, { rating: avgRating, totalReviews: reviews.length });
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        console.log("ProductId for reviews:", req.params.id);
        console.log("Reviews found:", reviews.length);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        console.log("ShopId:", shopId);

        const products = await Product.find({ shop: shopId });
        console.log("Products found:", products.length);

        // Return sanitized products
        res.json(products.map(sanitizeProductSpecs));
    } catch (err) {
        console.error("Error in getProductsByShop:", err);
        res.status(500).json({ message: err.message });
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        // Use case-insensitive regex to match category despite URL encoding differences
        const products = await Product.find({ category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
            .populate('shop', 'name city address phone location rating');
        console.log("category:", category);
        console.log("products found (category view):", products.length);
        res.json(products.map(sanitizeProductSpecs));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createProduct, getAllProducts, getProductById, getMyProducts, updateProduct, deleteProduct, addProductReview, getProductReviews, getProductsByShop, getProductsByCategory };
