const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'kartify_secret_key');
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) {
            if (role === 'seller' && existing.role === 'customer') {
                return res.status(400).json({ message: 'This email is already registered. Login to convert to seller.' });
            }
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password, phone, role: role || 'customer' });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Reset rate limit on successful login
        const { loginLimiter } = require('../middleware/rateLimiter');
        if (loginLimiter && loginLimiter.resetKey) {
            const key = email ? `${req.ip}-${email}` : req.ip;
            loginLimiter.resetKey(key);
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProfile = async (req, res) => {
    res.json(req.user);
};

module.exports = { registerUser, loginUser, getProfile };
