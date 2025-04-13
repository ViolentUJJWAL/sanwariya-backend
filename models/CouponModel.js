// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [5, 'Coupon code must be at least 5 characters long'],
        maxlength: [20, 'Coupon code cannot exceed 20 characters']
    },
    discountType: {
        type: String,
        enum: ['fixed', 'percentage'],
        required: [true, 'Discount type is required']
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        validate: {
            validator: function (value) {
                return value > 0;
            },
            message: 'Discount value must be greater than zero'
        }
    },
    expirationDate: {
        type: Date,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value > new Date();
            },
            message: 'Expiration date must be in the future'
        }
    },
    minimumPurchase: {
        type: Number,
        required: [true, 'Minimum purchase amount is required'],
        min: [0, 'Minimum purchase must be a positive value']
    },
    maxDiscountAmount: {
        type: Number,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value > 0;
            },
            message: 'Max discount amount must be greater than zero'
        }
    },
    usageLimit: {
        type: Number,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value > 0;
            },
            message: 'Usage limit must be greater than zero'
        }
    },
    usedCount: {
        type: Number,
        default: 0,
        min: [0, 'Used count cannot be negative']
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    customerEligibility: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    active: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
