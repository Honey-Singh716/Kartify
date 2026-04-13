const cloudinary = require('./backend/config/cloudinary');
console.log('--- Cloudinary Export Verification ---');
console.log('Cloudinary object available:', !!cloudinary);
console.log('Storage object available:', !!cloudinary.storage);
if (cloudinary.storage) {
    console.log('✅ Export verification passed');
} else {
    console.error('❌ Export verification failed');
    process.exit(1);
}
