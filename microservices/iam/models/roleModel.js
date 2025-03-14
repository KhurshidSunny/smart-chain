const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: [{ type: String }], // e.g., ['orders:read', 'inventory:write']
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
});

module.exports = mongoose.model('Role', roleSchema);