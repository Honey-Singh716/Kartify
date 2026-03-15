/**
 * fixShopLinks.js — Run ONCE to correct all product→shop references.
 *
 * How it works:
 *   1. Finds every seller (User with role = "seller")
 *   2. Finds that seller's Shop (Shop.owner = seller._id)
 *   3. Sets product.shop = shop._id for ALL products belonging to that seller
 *
 * This is safe — it only writes to the `shop` field and relies on the
 * existing `seller` field which is already correct.
 *
 * Run from the backend folder:
 *   node fixShopLinks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');

async function fixShopLinks() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');

    const sellers = await User.find({ role: 'seller' });

    if (sellers.length === 0) {
        console.log('No sellers found in the database.');
        return;
    }

    let totalFixed = 0;

    for (const seller of sellers) {
        const shop = await Shop.findOne({ owner: seller._id });

        if (!shop) {
            console.log(`⚠  Seller "${seller.email}" has no shop — skipping.`);
            continue;
        }

        // Reassign ALL products whose seller matches this user to the correct shop
        const result = await Product.updateMany(
            { seller: seller._id },
            { $set: { shop: shop._id } }
        );

        console.log(`✓  Seller: ${seller.email}`);
        console.log(`   Shop:   ${shop.name} (${shop.category})`);
        console.log(`   Fixed:  ${result.modifiedCount} product(s)\n`);
        totalFixed += result.modifiedCount;
    }

    // Products with NO seller — list them so you know what needs manual attention
    const orphans = await Product.find({ $or: [{ seller: null }, { seller: { $exists: false } }] });
    if (orphans.length > 0) {
        console.log(`⚠  ${orphans.length} product(s) have no seller and could not be fixed:`);
        orphans.forEach(p => console.log(`   - "${p.name}" (${p.category})`));
        console.log('\n  → Delete and recreate these through the Seller Dashboard.\n');
    }

    console.log(`Done. Total products re-linked: ${totalFixed}`);
    await mongoose.disconnect();
    process.exit(0);
}

fixShopLinks().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
