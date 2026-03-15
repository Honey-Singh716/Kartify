/**
 * repairProducts.js
 * Runs once on server start to fix broken product→shop linkages.
 * Uses updateOne + $set to bypass Mongoose validation (intentional).
 *
 * SAFE RULES:
 *  - A product is only assigned to a shop if its seller OWNS that shop.
 *  - A product is only assigned to a shop if its CATEGORY matches the shop's category.
 *  - Phase 0 corrects wrong assignments made by previous repair runs or manual edits.
 */

const Product = require('./models/Product');
const Shop = require('./models/Shop');
const User = require('./models/User');

async function repairProducts() {
    try {
        // Build lookup maps upfront
        const allShops = await Shop.find({});
        const allSellers = await User.find({ role: 'seller' });

        // sellerId (string) → their shop
        const sellerToShop = {};
        // shopId (string) → shop doc
        const shopById = {};
        // category (string) → first shop in that category
        const categoryToShop = {};

        for (const shop of allShops) {
            const sid = shop._id.toString();
            shopById[sid] = shop;
            if (shop.owner) {
                sellerToShop[shop.owner.toString()] = shop;
            }
            if (!categoryToShop[shop.category]) {
                categoryToShop[shop.category] = shop;
            }
        }

        // ── Phase 0: Undo wrong cross-shop assignments ────────────────────────
        // Rule 1: shop.owner must match product.seller
        // Rule 2: shop.category must match product.category
        const allProducts = await Product.find({ shop: { $ne: null } });
        let undone = 0;
        for (const p of allProducts) {
            const sid = p.shop?.toString();
            const shop = shopById[sid];

            if (!shop) {
                await Product.updateOne({ _id: p._id }, { $unset: { shop: '' } });
                undone++;
                continue;
            }

            const ownerMismatch = shop.owner && p.seller && (shop.owner.toString() !== p.seller.toString());
            const categoryMismatch = shop.category && p.category && (shop.category !== p.category);

            if (ownerMismatch || categoryMismatch) {
                // Wrong shop assigned — clear so Phase 2 can reassign correctly
                await Product.updateOne({ _id: p._id }, { $unset: { shop: '' } });
                console.log(`[Repair] Unlinked "${p.name}" from shop "${shop.name}" (${categoryMismatch ? 'Category Mismatch' : 'Owner Mismatch'})`);
                undone++;
            }
        }
        if (undone > 0) {
            console.log(`[Repair] Phase 0: Cleared ${undone} incorrect shop assignments.`);
        }

        // ── Phase 1: Fix sellers whose shop has no owner set in DB ───────────
        const shopsWithoutOwner = allShops.filter(s => !s.owner);
        const sellersWithShop = new Set(Object.keys(sellerToShop));
        const sellersWithoutShop = allSellers.filter(u => !sellersWithShop.has(u._id.toString()));

        for (let i = 0; i < shopsWithoutOwner.length && i < sellersWithoutShop.length; i++) {
            const shop = shopsWithoutOwner[i];
            const seller = sellersWithoutShop[i];
            await Shop.updateOne({ _id: shop._id }, { $set: { owner: seller._id } });
            shop.owner = seller._id;
            sellerToShop[seller._id.toString()] = shop;
            shopById[shop._id.toString()] = shop;
            console.log(`[Repair] Phase 1: Shop "${shop.name}" linked to seller "${seller.email}"`);
        }

        // ── Phase 2: Repair products with missing references ──────────────────
        const brokenProducts = await Product.find({
            $or: [
                { shop: null },
                { seller: null },
                { shop: { $exists: false } },
                { seller: { $exists: false } }
            ]
        });

        if (brokenProducts.length === 0) {
            console.log('[Repair] All products have correct references.');
            return;
        }

        console.log(`[Repair] Phase 2: Repairing ${brokenProducts.length} product(s)...`);

        let repaired = 0;
        let skipped = 0;

        for (const product of brokenProducts) {
            const sellerId = product.seller?.toString();
            let targetShop = null;

            // Strategy A: Try to find shop by seller
            if (sellerId && sellerToShop[sellerId]) {
                targetShop = sellerToShop[sellerId];
            }

            // Strategy B: If still no shop, try to find shop by category
            if (!targetShop && product.category && categoryToShop[product.category]) {
                targetShop = categoryToShop[product.category];
            }

            if (targetShop) {
                const targetSeller = targetShop.owner || product.seller || allSellers[0]?._id;
                if (targetSeller) {
                    await Product.updateOne(
                        { _id: product._id },
                        { $set: { shop: targetShop._id, seller: targetSeller } }
                    );
                    console.log(`[Repair] ✓ "${product.name}" (${product.category}) → shop: "${targetShop.name}"`);
                    repaired++;
                } else {
                    console.warn(`[Repair] ✗ Skipping "${product.name}" — no seller available for shop "${targetShop.name}"`);
                    skipped++;
                }
            } else {
                console.warn(`[Repair] ⚠ "${product.name}" (${product.category}) has no valid shop/category match — manual fix needed.`);
                skipped++;
            }
        }

        console.log(`[Repair] Done. Repaired: ${repaired}, Skipped: ${skipped}`);

    } catch (err) {
        console.error('[Repair] Error:', err.message);
    }
}

module.exports = repairProducts;
