const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');
const Address = require('../models/addressModel');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../services/jwtService');
const {
  REFRESH_COOKIE,
  CSRF_COOKIE,
  SessionError,
  readCookie,
  createCsrfToken,
  setSessionCookies,
  clearSessionCookies,
  authBody,
  establishSession,
  rotateRefresh,
  revokeRefresh,
} = require('../services/session');

function publicUser(user, roleName) {
  const role = roleName || (user.roleId && user.roleId.name) || user.role;
  return {
    id: user._id,
    email: user.email,
    role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

function blacklistExpiry(token) {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded.exp === 'number') return new Date(decoded.exp * 1000);
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function sessionDeps(roleName) {
  return {
    generateToken: (user) => generateToken(user, roleName),
    generateRefreshToken,
    createCsrfToken,
    verifyRefreshToken,
    loadUser: (decoded) => User.findById(decoded.id).populate('roleId'),
    isBlacklisted: async (token) => Boolean(await TokenBlacklist.findOne({ token })),
    blacklist: async (token) => {
      const existing = await TokenBlacklist.findOne({ token });
      if (existing) return;
      await new TokenBlacklist({ token, expiresAt: blacklistExpiry(token) }).save();
    },
  };
}

function sendAuth(res, status, session, user, roleName) {
  setSessionCookies(res, session.refreshToken, session.csrfToken);
  res.status(status).json(authBody(session, publicUser(user, roleName)));
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('roleId');
        if (!user || !user.isActive || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const session = establishSession(user, sessionDeps(user.roleId.name));
        sendAuth(res, 200, session, user, user.roleId.name);
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

        const session = establishSession(user, sessionDeps(role.name));
        sendAuth(res, 201, session, user, role.name);
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const session = await rotateRefresh({
            refreshToken: readCookie(req, REFRESH_COOKIE),
            csrfCookie: readCookie(req, CSRF_COOKIE),
            csrfHeader: req.get('x-csrf-token'),
        }, sessionDeps());
        sendAuth(res, 200, session, session.user);
    } catch (err) {
        if (!(err instanceof SessionError) || err.status !== 403) clearSessionCookies(res);
        const status = err.status || 401;
        res.status(status).json({ message: err.message || 'Invalid or expired refresh token' });
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
    try {
        await revokeRefresh({
            refreshToken: readCookie(req, REFRESH_COOKIE),
            csrfCookie: readCookie(req, CSRF_COOKIE),
            csrfHeader: req.get('x-csrf-token'),
        }, sessionDeps());
        clearSessionCookies(res);
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        const status = err.status || 500;
        if (status === 500) console.error(err);
        res.status(status).json({ message: err.message || 'Server error' });
    }
};