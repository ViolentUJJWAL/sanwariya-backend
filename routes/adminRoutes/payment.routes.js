const express = require("express");
const { getAllPayments, getPaymentById, updatePayment, changePaymentStatus, refundPayment } = require("../../controllers/adminControllers/payment.Controller");
const { isAdmin } = require("../../middleware/auth");
const router = express.Router();

// Get all payments with filters, search, and pagination
router.get("/",isAdmin, getAllPayments);

// Get a payment by ID
router.get("/:id",isAdmin, getPaymentById);

// Update a payment by ID
router.put("/:id",isAdmin, updatePayment);

// Change payment status
router.patch("/:id/status",isAdmin, changePaymentStatus);

// Refund a payment
router.post("/:id/refund",isAdmin, refundPayment);

module.exports = router;
