const { body, validationResult } = require('express-validator');

const validateOrder = [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
    body('items.*.name').optional().isString().withMessage('Item name must be text'),
    body('items.*.quantity').isInt({ min: 1, max: 10000 }).withMessage('Quantity must be a whole number from 1 to 10000'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
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