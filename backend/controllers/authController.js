const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'kartify_secret_key', { expiresIn: '30d' });
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
