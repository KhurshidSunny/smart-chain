/**
 * @file auth.js
 * @description This module provides functions for generating and verifying JWT access and refresh tokens
 * for user authentication in a Node.js application.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Minimal Claims:
 * - JWTs should contain only essential information to keep them lightweight and efficient.
 * - Here, we include `id`, `email`, and `role` to allow authentication and authorization checks.
 */
const generateToken = (user) => {
    return jwt.sign(
        { sub: user._id, role: user.roleId.name }, // Role name for Sales
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

/**
 * Refresh Token:
 * - A refresh token is used to obtain a new access token when the current one expires, without requiring the user to log in again.
 * - It is stored securely (e.g., in a httpOnly cookie or secure storage) and has a longer expiration period.
 * - Unlike access tokens, refresh tokens contain minimal user information for security purposes.
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET); // Synchronous for simplicity
};

module.exports = { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };
