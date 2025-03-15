const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
// const { rateLimiter } = require('../middleware/rateLimiter'); // Uncomment if rate limiting is required
const Joi = require('joi');

/**
 * Middleware to validate login request body using Joi
 */
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};

/**
 * Middleware to validate logout request body
 */
const validateLogout = (req, res, next) => {
    console.log(req.body)
    const schema = Joi.object({
        refreshToken: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    next();
};

// Routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/assign-role', authenticate, authorize('users:write'), authController.assignRole);
router.post('/refresh', authController.refreshToken);
router.post('/logout', validateLogout, authController.logout);

module.exports = router;