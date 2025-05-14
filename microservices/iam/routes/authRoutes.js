const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
// const { rateLimiter } = require('../middleware/rateLimiter'); // Uncomment if rate limiting is required
const Joi = require('joi');
const { validateLogout, validateRegistration } = require('../middleware/validation/joi_validation');





// Routes
router.post('/login', authController.login);
router.post('/register',validateRegistration, authController.register);
router.post('/assign-role', authenticate, authorize('users:write'), authController.assignRole);
router.post('/refresh', authController.refreshToken);
router.post('/logout', validateLogout, authController.logout);

module.exports = router;