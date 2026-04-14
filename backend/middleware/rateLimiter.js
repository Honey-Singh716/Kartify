let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    // Fallback if express-rate-limit is not installed
    const dummyLimiter = (req, res, next) => next();
    module.exports = { apiLimiter: dummyLimiter, loginLimiter: dummyLimiter };
    return;
}

// General API Limiter - More permissive
// Allows 500 requests every 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Strict Login Limiter
// Allows 10 attempts every 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    // Hybrid key: IP + Email (if available)
    keyGenerator: (req) => {
        return req.body.email ? `${req.ip}-${req.body.email}` : req.ip;
    },
    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
        res.status(options.statusCode).json({
            message: `Too many login attempts. Please try again after ${retryAfter} minutes.`,
            retryAfter: retryAfter // in minutes
        });
    }
});

module.exports = { apiLimiter, loginLimiter };
