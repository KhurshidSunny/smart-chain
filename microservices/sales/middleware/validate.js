const { body, validationResult } = require('express-validator');

const validateOrder = [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
    body('items.*.name').notEmpty().withMessage('Item name required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
    body('shippingAddress.street').notEmpty().withMessage('Street required'),
    body('shippingAddress.city').notEmpty().withMessage('City required'),
    body('shippingAddress.state').notEmpty().withMessage('State required'),
    body('shippingAddress.zipCode').notEmpty().withMessage('Zip code required'),
    body('shippingAddress.country').notEmpty().withMessage('Country required'),
    body('shippingAddress.addressId').optional().isMongoId().withMessage('Invalid address ID'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    },
];

module.exports = { validateOrder };