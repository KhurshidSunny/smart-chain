const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// User management endpoints
router.get('/users', authenticate, authorize('users:read'), userController.getUsers); // List all users
router.post('/users', authenticate, authorize('users:write'), userController.createUser); // Create a user
router.put('/users/:userId', authenticate, authorize('users:write'), userController.updateUser); // Update a user
router.delete('/users/:userId', authenticate, authorize('users:write'), userController.deleteUser); // Deactivate a user

module.exports = router;