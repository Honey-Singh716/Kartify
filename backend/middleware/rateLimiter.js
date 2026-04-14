const rateLimit = require('express-rate-limit');

// General API Limiter - More permissive
// Allows 500 requests every 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
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
    // Hybrid key: IP + Email (if available)
    keyGenerator: (req) => {
        return req.body.email ? `${req.ip}-${req.body.email}` : req.ip;
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: 'Too many login attempts. Please try again after 15 minutes.',
            retryAfter: Math.ceil(options.windowMs / 1000 / 60)
        });
    }
});

module.exports = { apiLimiter, loginLimiter };
