const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');
const { validateRegistration } = require('../middleware/validation/joi_validation');
const { requireCsrf } = require('../services/session');

router.post('/login', rateLimiter, authController.login);
router.post('/register', rateLimiter, validateRegistration, authController.register);
router.post('/assign-role', authenticate, authorize('users:write'), authController.assignRole);
router.post('/refresh', rateLimiter, requireCsrf, authController.refreshToken);
router.post('/logout', requireCsrf, authController.logout);

module.exports = router;
