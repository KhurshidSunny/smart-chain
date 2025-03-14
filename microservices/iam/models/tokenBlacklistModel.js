const mongoose = require('mongoose');

/**
 * TokenBlacklist Schema
 * - Stores blacklisted refresh tokens to prevent their reuse
 * - Includes expiration to automatically clean up old entries
 */
const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate tokens
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '0s' }, // TTL index to auto-remove expired tokens
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Create and export the model
module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);