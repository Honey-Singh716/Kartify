const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'kartify_secret_key');
            if (!secret && process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET is not defined');
            }
            const decoded = jwt.verify(token, secret);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const sellerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Sellers only.' });
    }
};

const customerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Customers only.' });
    }
};

module.exports = { protect, sellerOnly, customerOnly };
