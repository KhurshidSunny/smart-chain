const productController = require('./productController');
const reservationController = require('./reservationController');
const adjustmentController = require('./adjustmentController');
const eventHandlerController = require('./events/eventHandlerController');

module.exports = {
    productController,
    reservationController,
    adjustmentController,
    eventHandlerController,
};