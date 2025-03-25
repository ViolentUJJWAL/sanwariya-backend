const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const {
    placeOrder,
    updatePlaceOrder,
    getUserOrders
} = require('../../controllers/userControllers/order.controller'); // Adjust path as needed

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
};

// Place a new order
router.post(
    '/orders',
    [
        body('products').isArray({ min: 1 }).withMessage('Products must be a non-empty array'),
        body('products.*.product').isMongoId().withMessage('Invalid product ID'),
        body('products.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
        body('products.*.totalPrice').isFloat({ gt: 0 }).withMessage('Total price must be greater than 0'),
        body('products.*.productVariety').notEmpty().withMessage('Product variety is required'),
        body('address.flatNo').notEmpty().withMessage('Flat number is required'),
        body('address.street').notEmpty().withMessage('Street is required'),
        body('address.city').notEmpty().withMessage('City is required'),
        body('address.state').notEmpty().withMessage('State is required'),
        body('address.pincode').notEmpty().withMessage('Pincode is required'),
        body('address.country').notEmpty().withMessage('Country is required'),
        body('discountCode').optional().notEmpty().withMessage('Discount code cannot be empty'),
        body('paymentId').isMongoId().withMessage('Invalid payment ID'),
        body('customerNote').optional().notEmpty().withMessage('Customer note cannot be empty'),
        body('giftOptions').optional().exists().withMessage('Gift options must be provided if included'),
    ],
    validate,
    placeOrder
);

// Update an existing order
router.put(
    '/orders/:orderId',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('customerNote').optional().notEmpty().withMessage('Customer note cannot be empty'),
        body('giftOptions').optional().exists().withMessage('Gift options must be provided if included'),
        body('paymentId').optional().isMongoId().withMessage('Invalid payment ID'),
        body('address.flatNo').optional().notEmpty().withMessage('Flat number is required'),
        body('address.street').optional().notEmpty().withMessage('Street is required'),
        body('address.city').optional().notEmpty().withMessage('City is required'),
        body('address.state').optional().notEmpty().withMessage('State is required'),
        body('address.pincode').optional().notEmpty().withMessage('Pincode is required'),
        body('address.country').optional().notEmpty().withMessage('Country is required'),
    ],
    validate,
    updatePlaceOrder
);

// Get user orders
router.get(
    '/orders/me',
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
        query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    ],
    validate,
    getUserOrders
);

module.exports = router;