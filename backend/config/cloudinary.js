const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Safety Check: Log error and exit if env variables are missing in production
const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnv.forEach(v => {
    if (!process.env[v]) {
        console.error(`❌ Cloudinary Config Error: ${v} is missing`);
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ CRITICAL: Missing Cloudinary credentials. Exiting...');
            process.exit(1);
        }
    }
});

try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configured successfully');
} catch (err) {
    console.error('❌ Cloudinary Configuration Failed:', err.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kartify',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

// Primary export is cloudinary, with storage attached for multer compatibility
cloudinary.storage = storage;
module.exports = cloudinary;
