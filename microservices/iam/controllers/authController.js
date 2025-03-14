const User = require('../models/userModel');
const Role = require('../models/roleModel');
const TokenBlacklist = require('../models/tokenBlacklistModel'); // Import the new model
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../services/jwtService');

/**
 * Handles user login
 * - Validates credentials and returns tokens
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('roleId');
        if (!user || !user.isActive || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        user.lastLogin = Date.now(); // Track login for auditing
        await user.save();

        res.json({ token, refreshToken, user: { id: user._id, email: user.email, role: user.roleId.name } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Handles user registration
 * - Restricts role assignment to 'customer' for public registration
 */
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, roleName } = req.body;
        const allowedRoleName = 'customer';
        const role = await Role.findOne({ name: allowedRoleName });
        if (!role) return res.status(500).json({ message: 'Default role not found' });

        if (roleName && roleName !== allowedRoleName) {
            console.warn(`Registration attempt with unauthorized role: ${roleName}`);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const user = new User({
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            firstName,
            lastName,
            roleId: role._id,
        });
        await user.save();

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        res.status(201).json({ token, refreshToken, user: { id: user._id, email: user.email, role: role.name } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Refreshes access token using a refresh token
 * - Checks if the refresh token is blacklisted before proceeding
 */
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        // Check if the refresh token is blacklisted
        const blacklistedToken = await TokenBlacklist.findOne({ token: refreshToken });
        if (blacklistedToken) return res.status(401).json({ message: 'Refresh token has been invalidated' });

        const decoded = await verifyRefreshToken(refreshToken); // Await since it’s a Promise
        const user = await User.findById(decoded.id).populate('roleId');
        if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid refresh token' });

        const newToken = generateToken(user);
        res.json({ token: newToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

/**
 * Assigns a role to an existing user (admin-only endpoint)
 */
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

        res.json({ message: 'Role assigned successfully', user: { id: user._id, email: user.email, role: role.name } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Handles user logout
 * - Blacklists the refresh token to prevent further use
 */
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

        // Check if already blacklisted (optional optimization)
        const existing = await TokenBlacklist.findOne({ token: refreshToken });
        if (existing) return res.status(200).json({ message: 'Already logged out' });

        // Blacklist the token with an expiry matching REFRESH_TOKEN_EXPIRY (7 days)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        await new TokenBlacklist({ token: refreshToken, expiresAt }).save();

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Error during logout:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};