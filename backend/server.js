require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Optional Production Middleware (fail-safe for local dev)
let helmet, rateLimit, compression, logger;
try {
  helmet = require('helmet');
  rateLimit = require('express-rate-limit');
  compression = require('compression');
  logger = require('./utils/logger');
} catch (e) {
  // In development, handle missing optional packages gracefully
  console.warn("⚠️ Production middleware (helmet, express-rate-limit, compression, winston) not found. Using fallback logging.");
  logger = {
    info: (msg) => console.log(`[${new Date().toLocaleTimeString()}] INFO: ${msg}`),
    error: (msg, err) => console.error(`[${new Date().toLocaleTimeString()}] ERROR: ${msg}`, err || ''),
    warn: (msg) => console.warn(`[${new Date().toLocaleTimeString()}] WARN: ${msg}`)
  };
}

const app = express();

// Trust Proxy for Production (Render/Vercel)
app.set('trust proxy', 1);

// Security & Optimization Middleware (Conditional)
if (helmet) app.use(helmet());
if (compression) app.use(compression());

// CORS configuration (Hardened)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const { apiLimiter, loginLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Check for required environment variables
const checkEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  required.forEach(v => {
    if (!process.env[v]) {
      logger.error(`❌ CRITICAL: ${v} is not defined in environment variables`);
      if (process.env.NODE_ENV === 'production') process.exit(1);
    }
  });
};
checkEnv();

// MongoDB Connection with Retry Logic
const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      logger.info("✅ MongoDB Connected");
      break;
    } catch (err) {
      logger.error(`❌ MongoDB Connection Error (${retries} retries left):`, err.message);
      retries -= 1;
      if (retries === 0) {
        logger.error("❌ CRITICAL: Could not connect to MongoDB after multiple attempts");
        if (process.env.NODE_ENV === 'production') process.exit(1);
      }
      // Wait 5 seconds before retrying
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Kartify API is running 🚀' });
});

// Global Error Handler (Production Ready)
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    error: process.env.NODE_ENV === 'production' ? null : err
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
