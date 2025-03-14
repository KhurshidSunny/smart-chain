/**
 * @file authMiddleware.js
 * @description Middleware functions for authentication and authorization in a Node.js application.
 * Ensures only authenticated users can access protected routes and enforces role-based permissions.
 */

const { verifyToken } = require('../services/jwtService');
const Role = require('../models/roleModel');

/**
 * @function authenticate
 * @description Middleware to verify JWT token and attach user data to the request object.
 * - Extracts token from `Authorization` header (expects format: `Bearer <token>`).
 * - Decodes and verifies the token.
 * - Attaches decoded user data (`req.user`) for downstream use.
 * - Responds with `401 Unauthorized` if the token is missing or invalid.
 */
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1]; // Extract token from header
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * @function authorize
 * @description Middleware to enforce role-based access control (RBAC).
 * - Fetches the user's role from the database.
 * - Checks if the role has the required permission.
 * - Responds with `403 Forbidden` if the user lacks permission.
 * - Otherwise, proceeds to the next middleware/controller.
 *
 * @param {string} requiredPermission - The permission required to access the route.
 */
const authorize = (requiredPermission) => async (req, res, next) => {
    try {
        const role = await Role.findById(req.user.role);
        if (!role || !role.permissions.includes(requiredPermission)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Authorization error' });
    }
};

module.exports = { authenticate, authorize };
