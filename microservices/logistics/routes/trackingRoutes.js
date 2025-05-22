const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getTrackingEvents,
    createTrackingEvent,
    getTrackingByNumber
} = require('../controllers/trackingController');

router.get('/:id/tracking', authMiddleware(['admin', 'warehouse_manager', 'sales_manager', 'logistics_manager', 'customer_service', 'customer']), getTrackingEvents);
router.post('/:id/tracking-events', authMiddleware(['logistics_manager', 'admin']), createTrackingEvent);
router.get('/number/:trackingNumber', getTrackingByNumber); // Public endpoint, no auth required

module.exports = router;