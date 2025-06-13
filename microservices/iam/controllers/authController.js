const User = require('../models/userModel');
const Role = require('../models/roleModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');
const Address = require('../models/addressModel'); // New import
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../services/jwtService');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('roleId');
        if (!user || !user.isActive || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        user.lastLogin = Date.now();
        await user.save();

        res.json({ token, refreshToken, user: { id: user._id, email: user.email, role: user.roleId.name, firstName: user.firstName, lastName: user.lastName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, address } = req.body; // Add address
        const allowedRoleName = 'customer';
        const role = await Role.findOne({ name: allowedRoleName });
        if (!role) return res.status(500).json({ message: 'Customer role not found' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const user = new User({
            email,
            passwordHash: password,
            firstName,
            lastName,
            roleId: role._id,
        });

        // Optional: Add initial address during registration
        if (address) {
            const newAddress = new Address({
                userId: user._id,
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                country: address.country,
                isDefault: true,
            });
            await newAddress.save();
            user.addresses = [newAddress._id];
        }

        await user.save();

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        res.status(201).json({ token, refreshToken, user: { id: user._id, email: user.email, role: role.name, firstName: user.firstName, lastName: user.lastName } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        const blacklistedToken = await TokenBlacklist.findOne({ token: refreshToken });
        if (blacklistedToken) return res.status(401).json({ message: 'Refresh token invalidated' });

        const decoded = await verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id).populate('roleId');
        if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid refresh token' });

        const newToken = generateToken(user);
        res.json({ token: newToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

exports.assignRole = async (req, res) => {
    try {
        const { userId, roleName } = req.body;
        const role = await Role.findOne({ name: roleName });
        if (!role) return res.status(400).json({ message: 'Invalid role' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.roleId = role._id;
        user.updatedAt = Date.now();
        await user.save();

        res.json({ message: 'Role assigned', user: { id: user._id, email: user.email, role: role.name } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    console.log(req.body)
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        const existing = await TokenBlacklist.findOne({ token: refreshToken });
        if (existing) return res.status(200).json({ message: 'Already logged out' });

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await new TokenBlacklist({ token: refreshToken, expiresAt }).save();

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};