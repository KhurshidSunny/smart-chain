const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    createShipment,
    getShipments,
    getShipmentById,
    updateShipmentStatus,
    dispatchShipment,
    deliverShipment
} = require('../controllers/shipmentController');

router.post('/', authMiddleware(['logistics_manager', 'admin']), createShipment);
router.get('/', authMiddleware(['admin', 'warehouse_manager', 'sales_manager', 'logistics_manager', 'customer_service']), getShipments);
router.get('/:id', authMiddleware(['admin', 'warehouse_manager', 'sales_manager', 'logistics_manager', 'customer_service']), getShipmentById);
router.put('/:id/status', authMiddleware(['logistics_manager', 'admin']), updateShipmentStatus);
router.put('/:id/dispatch', authMiddleware(['logistics_manager', 'admin']), dispatchShipment);
router.put('/:id/deliver', authMiddleware(['logistics_manager', 'admin', 'customer_service', 'customer']), deliverShipment);

module.exports = router;