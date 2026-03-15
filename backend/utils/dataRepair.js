const Product = require('../models/Product');
const Shop = require('../models/Shop');

const runDataRepair = async () => {
    try {
        console.log("--- Starting One-Time Data Repair ---");
        const products = await Product.find();
        const defaultShop = await Shop.findOne();

        for (let product of products) {
            let repaired = false;

            // Goal 1: Fix Seller reference if missing
            if (!product.seller) {
                if (defaultShop && defaultShop.owner) {
                    product.seller = defaultShop.owner;
                }
            }

            // Goal 2: Fix Shop reference
            // Try to find shop by seller first
            if (product.seller) {
                const sellerShop = await Shop.findOne({ owner: product.seller });
                if (sellerShop) {
                    product.shop = sellerShop._id;
                    repaired = true;
                }
            }

            // Fallback: If still no shop, use default
            if (!product.shop && defaultShop) {
                product.shop = defaultShop._id;
                product.seller = defaultShop.owner;
                repaired = true;
            }

            if (repaired && product.seller && product.shop) {
                try {
                    await product.save();
                    console.log(`[OK] Repaired product: "${product.name}" -> Shop: "${product.shop}"`);
                } catch (saveErr) {
                    console.error(`[FAIL] Could not save product "${product.name}":`, saveErr.message);
                }
            }
        }
        console.log("--- Data Repair Completed ---");
    } catch (err) {
        console.error("Data Repair Error:", err.message);
    }
};

module.exports = runDataRepair;
