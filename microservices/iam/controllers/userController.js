const User = require('../models/userModel');
const Role = require('../models/roleModel');
const Address = require('../models/addressModel');

/**
 * Gets a list of all users in the system with basic information
 * Requires 'users:read' permission
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('roleId', 'name description');
        const userList = users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.roleId.name,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
        res.json(userList);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Fetches the current authenticated user's profile and information
 * Available to any authenticated user without additional permissions
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.sub;

        // Find user and populate role information
        const user = await User.findById(userId)
            .populate('roleId', 'name description')
            .populate('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update last login time
        user.lastLogin = Date.now();
        await user.save();

        // Return user profile with relevant information
        res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: {
                name: user.roleId.name,
                description: user.roleId.description
            },
            addresses: user.addresses,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, roleName, address } = req.body;
        if (!email || !password || !firstName || !lastName || !roleName) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const role = await Role.findOne({ name: roleName });
        if (!role) return res.status(400).json({ message: 'Invalid role' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email exists' });

        const user = new User({
            email,
            passwordHash: password,
            firstName,
            lastName,
            roleId: role._id,
        });

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
        res.status(201).json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: role.name,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, firstName, lastName, roleName, isActive } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (roleName) {
            const role = await Role.findOne({ name: roleName });
            if (!role) return res.status(400).json({ message: 'Invalid role' });
            user.roleId = role._id;
        }

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
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = false;
        user.updatedAt = Date.now();
        await user.save();
        res.json({ message: 'User deactivated', id: user._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Address Endpoints
exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user.sub;
        const addresses = await Address.find({ userId });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { street, city, state, zipCode, country, isDefault, type } = req.body;

        const newAddress = new Address({
            userId,
            street,
            city,
            state,
            zipCode,
            country,
            isDefault: isDefault || false,
            type: type || 'Home',
        });
        await newAddress.save();

        const user = await User.findById(userId);
        if (isDefault) {
            // Set other addresses to non-default
            await Address.updateMany({ userId, _id: { $ne: newAddress._id } }, { isDefault: false });
        }
        user.addresses.push(newAddress._id);
        await user.save();

        res.status(201).json(newAddress);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.sub;
        const { street, city, state, zipCode, country, isDefault, type } = req.body;

        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) return res.status(404).json({ message: 'Address not found or unauthorized' });

        address.street = street || address.street;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zipCode = zipCode || address.zipCode;
        address.country = country || address.country;
        address.type = type || address.type;
        if (typeof isDefault === 'boolean') {
            address.isDefault = isDefault;
            if (isDefault) {
                await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
            }
        }
        address.updatedAt = Date.now();
        await address.save();

        res.json(address);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.sub;

        const address = await Address.findOneAndDelete({ _id: addressId, userId });
        if (!address) return res.status(404).json({ message: 'Address not found or unauthorized' });

        const user = await User.findById(userId);
        user.addresses = user.addresses.filter(id => id.toString() !== addressId);
        await user.save();

        res.json({ message: 'Address deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};