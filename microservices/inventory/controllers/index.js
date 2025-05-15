const productController = require('./productController');
const reservationController = require('./reservationController');
const adjustmentController = require('./adjustmentController');
const eventHandlerController = require('./events/eventHandlerController');
const inventoryController = require('./inventoryController')

module.exports = {
    productController,
    reservationController,
    adjustmentController,
    eventHandlerController,
    inventoryController
};