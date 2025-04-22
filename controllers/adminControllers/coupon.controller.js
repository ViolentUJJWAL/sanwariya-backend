const Coupon = require("../../models/CouponModel");


// Helper function for error response
const handleError = (res, message, error, status = 400) => {
    res.status(status).json({ message, error: error?.message || error });
};

// Add a new coupon
exports.addCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, expirationDate, minimumPurchase, maxDiscountAmount, usageLimit, applicableProducts, customerEligibility } = req.body;

        if (!code || !discountType || !discountValue || !minimumPurchase) {
            return handleError(res, 'Missing required fields', null);
        }

        if (!['fixed', 'percentage'].includes(discountType)) {
            return handleError(res, 'Invalid discount type');
        }

        if (discountValue <= 0) {
            return handleError(res, 'Discount value must be greater than zero');
        }

        if (minimumPurchase < 0) {
            return handleError(res, 'Minimum purchase amount must be a positive value');
        }

        if (maxDiscountAmount && maxDiscountAmount <= 0) {
            return handleError(res, 'Max discount amount must be greater than zero');
        }

        if (usageLimit && usageLimit <= 0) {
            return handleError(res, 'Usage limit must be greater than zero');
        }

        if (expirationDate && new Date(expirationDate) < new Date()) {
            return handleError(res, 'Expiration date must be in the future');
        }

        const coupon = new Coupon({ code, discountType, discountValue, expirationDate, minimumPurchase, maxDiscountAmount, usageLimit, applicableProducts, customerEligibility });
        await coupon.save();
        res.status(201).json({ message: 'Coupon added successfully', coupon });
    } catch (error) {
        handleError(res, 'Failed to add coupon', error);
    }
};

// Update an existing coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const validFields = [
            'code', 'discountType', 'discountValue', 'expirationDate',
            'minimumPurchase', 'maxDiscountAmount', 'usageLimit',
            'applicableProducts', 'customerEligibility', 'active'
        ];

        for (let key of Object.keys(updates)) {
            if (!validFields.includes(key)) {
                return handleError(res, `Invalid update field: ${key}`);
            }
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!updatedCoupon) return handleError(res, 'Coupon not found', null, 404);

        res.status(200).json({ message: 'Coupon updated successfully', updatedCoupon });
    } catch (error) {
        handleError(res, 'Failed to update coupon', error);
    }
};

// Get all valid (active and not expired) coupons
exports.getValidCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const coupons = await Coupon.find({
            active: true, $or: [
                { expirationDate: null },
                { expirationDate: { $gt: currentDate } }
            ]
        });

        res.status(200).json({ message: 'Valid coupons retrieved successfully', coupons });
    } catch (error) {
        handleError(res, 'Failed to retrieve coupons', error, 500);
    }
};

// Soft delete a coupon (set active to false)
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCoupon = await Coupon.findByIdAndUpdate(id, { active: false }, { new: true });

        if (!deletedCoupon) return handleError(res, 'Coupon not found', null, 404);

        res.status(200).json({ message: 'Coupon deactivated successfully', deletedCoupon });
    } catch (error) {
        handleError(res, 'Failed to deactivate coupon', error, 500);
    }
};

// Apply a coupon
exports.applyCoupon = async (req, res) => {
    try {
        const { code, products } = req.body;
        // products: {product, totalPrice}

        if (!code || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Coupon code and products with totalPrice are required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found or inactive' });
        }

        // Check expiration
        if (coupon.expirationDate && coupon.expirationDate < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check customer eligibility
        if (coupon.customerEligibility?.length > 0) {
            const isEligible = coupon.customerEligibility.some(userId => userId.equals(req.user._id));
            if (!isEligible) {
                return res.status(403).json({ message: 'You are not eligible to use this coupon' });
            }
        }

        let eligibleTotal = 0;
        const applicableProductIds = coupon.applicableProducts?.map(id => id.toString()) || [];

        // If coupon has applicableProducts, filter products that match
        if (applicableProductIds.length > 0) {
            for (const item of products) {
                if (applicableProductIds.includes(item.product)) {
                    eligibleTotal += item.totalPrice;
                }
            }

            if (eligibleTotal === 0) {
                return res.status(400).json({ message: 'Coupon is not applicable to any of the selected products' });
            }
        } else {
            // If no specific applicableProducts, apply on all
            eligibleTotal = products.reduce((sum, item) => sum + item.totalPrice, 0);
        }

        // Check minimum purchase condition
        if (eligibleTotal < coupon.minimumPurchase) {
            return res.status(400).json({ message: `Minimum purchase amount is ${coupon.minimumPurchase}` });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discountAmount = (eligibleTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
        }

        return res.status(200).json({
            message: 'Coupon applied successfully',
            discountAmount,
            eligibleTotal,
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({ message: 'Failed to apply coupon' });
    }
};

