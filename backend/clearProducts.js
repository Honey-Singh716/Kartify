/**
 * clearProducts.js
 * ONE-TIME script: Deletes ALL products from the database.
 * Does NOT delete users, shops, or orders.
 *
 * Run ONCE from the backend folder:
 *   node clearProducts.js
 *
 * After running: log in as each seller and re-add their products
 * through the Seller Dashboard. Products created that way will
 * automatically get the correct shop and seller references.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function clearProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Product.deleteMany({});
        console.log(`✅ Cleared ${result.deletedCount} products from the database.`);
        console.log('Shops, users, and orders are untouched.');
        console.log('\nNext step: Log in as each seller and re-add their products via the Seller Dashboard.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
}

clearProducts();
