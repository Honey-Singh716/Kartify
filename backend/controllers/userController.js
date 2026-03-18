const User = require('../models/User');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Only allow updating specific fields
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;
        user.city = req.body.city || user.city;
        user.state = req.body.state || user.state;
        user.pincode = req.body.pincode || user.pincode;
        // Save map-picked location if provided
        if (req.body.location?.lat && req.body.location?.lng) {
            user.location = { lat: req.body.location.lat, lng: req.body.location.lng };
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address,
            city: updatedUser.city,
            state: updatedUser.state,
            pincode: updatedUser.pincode,
            location: updatedUser.location
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getProfile, updateProfile };
