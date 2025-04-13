const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const {
    adminUpdateOrder,
    getAllOrders
} = require('../../controllers/adminControllers/order.controller'); // Adjust path as needed
const { isAdmin } = require('../../middleware/auth');

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
};

// Admin update order
router.put(
    '/:orderId',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('shippingMethod').optional().notEmpty().withMessage('Shipping method cannot be empty'),
        body('trackingNumber').optional().notEmpty().withMessage('Tracking number cannot be empty'),
        body('estimatedDeliveryDate').optional().isISO8601().withMessage('Estimated delivery date must be a valid date'),
        body('status').optional().isIn(['pending', 'processing', 'shipped', 'cancelled', 'completed']).withMessage('Invalid status'),
        body('orderTracking').optional().isArray().withMessage('Order tracking must be an array'),
        body('orderTracking.*.dateAndTime').optional().isISO8601().withMessage('Tracking date must be valid'),
        body('orderTracking.*.location').optional().notEmpty().withMessage('Tracking location is required'),
        body('adminNote').optional().notEmpty().withMessage('Admin note cannot be empty'),
        body('refund.isRefunded').optional().isBoolean().withMessage('Refund status must be boolean'),
        body('refund.amount').optional().isFloat({ gt: 0 }).withMessage('Refund amount must be greater than 0'),
        body('refund.reason').optional().notEmpty().withMessage('Refund reason cannot be empty'),
        body('refund.refundedAt').optional().isISO8601().withMessage('Refunded date must be valid'),
    ],
    validate,
    isAdmin,
    adminUpdateOrder
);

// Get all orders (admin)
router.get(
    '',
    [
        query('status').optional().isIn(['pending', 'processing', 'shipped', 'cancelled', 'completed']).withMessage('Invalid status'),
        query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
        query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    ],
    validate,
    isAdmin,
    getAllOrders
);

module.exports = router;