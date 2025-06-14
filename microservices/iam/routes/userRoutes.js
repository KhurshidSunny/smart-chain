const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorize('users:read'), userController.getUsers);
router.post('/', authenticate, authorize('users:write'), userController.createUser);
router.put('/:userId', authenticate, authorize('users:write'), userController.updateUser);
router.delete('/:userId', authenticate, authorize('users:write'), userController.deleteUser);
router.get('/:userId', authenticate, authorize('users:read'), userController.getUserById)

// Get the current logged in user
router.get('/me', authenticate, userController.getCurrentUser);
router.get('/me/addresses', authenticate, authorize('addresses:read'), userController.getAddresses);
router.post('/me/addresses', authenticate, authorize('addresses:write'), userController.addAddress);
router.put('/me/addresses/:addressId', authenticate, authorize('addresses:write'), userController.updateAddress);
router.delete('/me/addresses/:addressId', authenticate, authorize('addresses:write'), userController.deleteAddress);

module.exports = router;