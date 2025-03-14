const User = require('../models/userModel');

/**
 * Retrieves a list of all users
 * - Accessible only to users with 'users:read' permission (e.g., admin)
 * - Returns minimal user data to reduce exposure
 */
exports.getUsers = async (req, res) => {
    try {
        // Fetch all users and populate their role details
        const users = await User.find({}).populate('roleId', 'name description'); // Only fetch role name and description

        // Map users to a safe response format, excluding sensitive fields like passwordHash
        const userList = users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.roleId.name, // Role name from populated roleId
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        res.json(userList);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Creates a new user (placeholder)
 * - Requires 'users:write' permission
 * - Example endpoint for admin to create users with specific roles
 */
exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, roleName } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !roleName) {
            return res.status(400).json({ message: 'All fields (email, password, firstName, lastName, roleName) are required' });
        }

        const Role = require('../models/roleModel');
        const role = await Role.findOne({ name: roleName });
        if (!role) return res.status(400).json({ message: 'Invalid role' });

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

        res.status(201).json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: role.name,
        });
    } catch (err) {
        console.error('Error creating user:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Updates an existing user (placeholder)
 * - Requires 'users:write' permission
 * - Example endpoint for admin to update user details or roles
 */
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params; // Assume userId is passed in URL
        const { email, firstName, lastName, roleName, isActive } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const Role = require('../models/roleModel');
        if (roleName) {
            const role = await Role.findOne({ name: roleName });
            if (!role) return res.status(400).json({ message: 'Invalid role' });
            user.roleId = role._id;
        }

        // Update fields if provided
        if (email) user.email = email;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        user.updatedAt = Date.now();

        await user.save();

        res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: (await Role.findById(user.roleId)).name,
            isActive: user.isActive,
        });
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Deletes a user (placeholder)
 * - Requires 'users:write' permission
 * - Soft delete by setting isActive to false
 */
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params; // Assume userId is passed in URL

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = false; // Soft delete instead of hard delete for audit purposes
        user.updatedAt = Date.now();
        await user.save();

        res.json({ message: 'User deactivated successfully', id: user._id });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};