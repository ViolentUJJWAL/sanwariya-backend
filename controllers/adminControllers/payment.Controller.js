const mongoose = require("mongoose");
const Payment = require("../../models/PaymentModel");

// Helper: Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get All Payments with filter, search, pagination
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, method, search } = req.query;

    const query = {};

    if (status) query.paymentStatus = status;
    if (method) query.paymentMethod = method;

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { amount: isNaN(search) ? undefined : Number(search) },
      ];
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate("paymentBy", "name email")
      .populate("paymentRefundBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const decryptedPayments = payments.map((p) => p.decryptFields());

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      payments: decryptedPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get Payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findById(id)
      .populate("paymentBy", "name email")
      .populate("paymentRefundBy", "name email");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, payment: payment.decryptFields() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update Payment (excluding sensitive fields like transactionId, etc.)
// Utility function for IFSC validation
const isValidIFSC = (code) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code);

// Utility function for account number validation
const isValidAccountNumber = (num) => /^\d{9,18}$/.test(num);

// Controller
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const {
      paymentMethod,
      paymentInfo,
      transactionId,
      amount,
      transactionDateAndTime,
      paymentStatus,
      refundAmount,
      paymentRefundBy,
      paymentRefundMethod,
      paymentRefundInfo,
      paymentRefundTransactionId,
      paymentRefundDateAndTime,
      paymentRefundStatus,
      refundAccount,
    } = req.body;

    // Basic field validations
    const errors = [];

    if (paymentMethod && !["cash", "card", "UPI"].includes(paymentMethod)) {
      errors.push("Invalid payment method.");
    }

    if (paymentStatus && !["pending", "paid", "unpaid", "refunded"].includes(paymentStatus)) {
      errors.push("Invalid payment status.");
    }

    if (paymentRefundStatus && !["pending", "refunded"].includes(paymentRefundStatus)) {
      errors.push("Invalid refund status.");
    }

    if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
      errors.push("Amount must be a non-negative number.");
    }

    if (refundAmount !== undefined && (typeof refundAmount !== "number" || refundAmount < 0)) {
      errors.push("Refund amount must be a non-negative number.");
    }

    // Validate refund account details
    if (refundAccount) {
      const { accountNumber, ifscCode, holderName, bankName } = refundAccount;

      if (!accountNumber || !isValidAccountNumber(accountNumber)) {
        errors.push("Invalid or missing account number.");
      }

      if (!ifscCode || !isValidIFSC(ifscCode)) {
        errors.push("Invalid or missing IFSC code.");
      }

      if (!holderName || typeof holderName !== "string") {
        errors.push("Account holder name is required.");
      }

      if (!bankName || typeof bankName !== "string") {
        errors.push("Bank name is required.");
      }
    }

    // If any validation fails
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Update the payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      {
        paymentMethod,
        paymentInfo,
        transactionId,
        amount,
        transactionDateAndTime,
        paymentStatus,
        refundAmount,
        paymentRefundBy,
        paymentRefundMethod,
        paymentRefundInfo,
        paymentRefundTransactionId,
        paymentRefundDateAndTime,
        paymentRefundStatus,
        refundAccount,
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, payment: updatedPayment.decryptFields() });
  } catch (err) {
    console.error("Update payment error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
// Change Payment Status
exports.changePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "paid", "unpaid", "refunded"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.paymentStatus = status;
    await payment.save();

    res.status(200).json({ success: true, payment: payment.decryptFields() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Refund Payment
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      refundAmount,
      paymentRefundBy,
      paymentRefundMethod,
      paymentRefundTransactionId,
      paymentRefundInfo,
      paymentRefundDateAndTime,
      refundAccount,
    } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(paymentRefundBy)) {
      return res.status(400).json({ success: false, message: "Invalid IDs provided" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({ success: false, message: "Refund amount exceeds payment amount" });
    }

    payment.refundAmount = refundAmount;
    payment.paymentRefundBy = paymentRefundBy;
    payment.paymentRefundMethod = paymentRefundMethod;
    payment.paymentRefundTransactionId = paymentRefundTransactionId;
    payment.paymentRefundInfo = paymentRefundInfo;
    payment.paymentRefundDateAndTime = paymentRefundDateAndTime;
    payment.paymentRefundStatus = "refunded";
    payment.paymentStatus = "refunded";
    payment.refundAccount = refundAccount;

    await payment.save();

    res.status(200).json({ success: true, message: "Refund processed", payment: payment.decryptFields() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
