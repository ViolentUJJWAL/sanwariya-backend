const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const {
    addCoupon,
    updateCoupon,
    getValidCoupons,
    deleteCoupon,
    applyCoupon
} = require('../../controllers/adminControllers/coupon.controller'); // Adjust path as needed

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
};

// Add a new coupon
router.post(
    '/coupons',
    [
        body('code').notEmpty().withMessage('Coupon code is required'),
        body('discountType').isIn(['fixed', 'percentage']).withMessage('Discount type must be fixed or percentage'),
        body('discountValue').isFloat({ gt: 0 }).withMessage('Discount value must be greater than 0'),
        body('minimumPurchase').isFloat({ min: 0 }).withMessage('Minimum purchase must be a positive number'),
        body('maxDiscountAmount').optional().isFloat({ gt: 0 }).withMessage('Max discount amount must be greater than 0'),
        body('usageLimit').optional().isInt({ gt: 0 }).withMessage('Usage limit must be greater than 0'),
        body('expirationDate').optional().isISO8601().withMessage('Expiration date must be a valid date'),
    ],
    validate,
    addCoupon
);

// Update a coupon
router.put(
    '/coupons/:id',
    [
        param('id').isMongoId().withMessage('Invalid coupon ID'),
        body('discountType').optional().isIn(['fixed', 'percentage']).withMessage('Discount type must be fixed or percentage'),
        body('discountValue').optional().isFloat({ gt: 0 }).withMessage('Discount value must be greater than 0'),
        body('minimumPurchase').optional().isFloat({ min: 0 }).withMessage('Minimum purchase must be a positive number'),
        body('maxDiscountAmount').optional().isFloat({ gt: 0 }).withMessage('Max discount amount must be greater than 0'),
        body('usageLimit').optional().isInt({ gt: 0 }).withMessage('Usage limit must be greater than 0'),
        body('expirationDate').optional().isISO8601().withMessage('Expiration date must be a valid date'),
        body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    ],
    validate,
    updateCoupon
);

// Get all valid coupons
router.get('/coupons/valid', getValidCoupons);

// Soft delete a coupon
router.delete(
    '/coupons/:id',
    [
        param('id').isMongoId().withMessage('Invalid coupon ID'),
    ],
    validate,
    deleteCoupon
);

// Apply a coupon
router.post(
    '/coupons/apply',
    [
        body('code').notEmpty().withMessage('Coupon code is required'),
        body('totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be greater than 0'),
    ],
    validate,
    applyCoupon
);

module.exports = router;