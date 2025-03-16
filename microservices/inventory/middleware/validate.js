const { body, validationResult } = require('express-validator');

const validateProduct = [
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('unitCost').isNumeric().withMessage('Unit cost must be a number'),
    body('stockLevel').isInt({ min: 0 }).withMessage('Stock level must be a non-negative integer'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateProductUpdate = [
    body('sku').optional().notEmpty().withMessage('SKU cannot be empty if provided'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty if provided'),
    body('unitCost').optional().isNumeric().withMessage('Unit cost must be a number if provided'),
    body('stockLevel').optional().isInt({ min: 0 }).withMessage('Stock level must be non-negative if provided'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
const validateReservation = [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateAdjustment = [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt().withMessage('Quantity must be an integer'),
    body('reason').notEmpty().withMessage('Reason is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = { validateProduct, validateProductUpdate, validateReservation, validateAdjustment };