const mongoose = require("mongoose");
const crypto = require("crypto");

const IV_LENGTH = parseInt(process.env.IV_LENGTH, 10) || 16; // Default to 16 if not set
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SPLIT = process.env.ENCRYPTION_SPLIT;

// Encryption function
function encrypt(text) {
  if (!ENCRYPTION_KEY || !ENCRYPTION_SPLIT) {
    throw new Error("Encryption key or split character is not set.");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ENCRYPTION_SPLIT + encrypted;
}

// Decryption function
function decrypt(text) {
  if (!ENCRYPTION_KEY || !ENCRYPTION_SPLIT) {
    throw new Error("Encryption key or split character is not set.");
  }
  const parts = text.split(ENCRYPTION_SPLIT);
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Payment Schema
const PaymentModel = new mongoose.Schema(
  {
    paymentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide the user making the payment."],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "UPI"],
      required: [true, "Please provide a payment method."],
    },
    paymentInfo: {
      type: Object,
    },
    transactionId: {
      type: String,
      required: [true, "Please provide a transaction ID."],
    },
    amount: {
      type: Number,
      required: [true, "Please provide an amount."],
    },
    transactionDateAndTime: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "unpaid", "refunded"],
      required: [true, "Please provide a payment status."],
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    paymentRefundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    paymentRefundMethod: {
      type: String,
      enum: ["card", "UPI", "bank"],
    },
    paymentRefundInfo: {
      type: Object,
    },
    paymentRefundTransactionId: {
      type: String,
    },
    paymentRefundDateAndTime: {
      type: Date,
    },
    paymentRefundStatus: {
      type: String,
      enum: ["pending", "refunded"],
      default: "pending",
    },
    refundAccount: {
      accountNumber: {
        type: String,
        required: [true, "Please provide an account number."],
      },
      ifscCode: {
        type: String,
        required: [true, "Please provide an IFSC code."],
      },
      holderName: {
        type: String,
        required: [true, "Please provide the account holder's name."],
      },
      bankName: {
        type: String,
        required: [true, "Please provide the bank name."],
      },
    },
  },
  { timestamps: true }
);

// Middleware to validate and encrypt fields before saving
PaymentModel.pre("save", function (next) {
  const document = this;

  const excludeFields = [
    "paymentBy",
    "paymentRefundBy",
    "paymentRefundStatus",
    "paymentRefundMethod",
    "paymentMethod",
  ];

  // Validate fields before encryption
  if (document.refundAccount) {
    const { accountNumber, ifscCode } = document.refundAccount;

    // Validate account number
    if (accountNumber && !/^\d{9,18}$/.test(accountNumber)) {
      return next(new Error(`${accountNumber} is not a valid account number.`));
    }

    // Validate IFSC code
    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return next(new Error(`${ifscCode} is not a valid IFSC code.`));
    }
  }

  // Encrypt fields
  Object.keys(document.toObject()).forEach((key) => {
    if (excludeFields.includes(key)) return;

    if (typeof document[key] === "string" || typeof document[key] === "number") {
      document[key] = encrypt(document[key].toString());
    } else if (typeof document[key] === "object" && document[key] !== null) {
      Object.keys(document[key]).forEach((nestedKey) => {
        if (typeof document[key][nestedKey] === "string") {
          document[key][nestedKey] = encrypt(document[key][nestedKey]);
        }
      });
    }
  });

  next();
});


PaymentModel.methods.decryptFields = function () {
  const document = this.toObject();

  // Fields that are not encrypted
  const nonEncryptedFields = [
    "paymentBy",
    "paymentRefundBy",
    "paymentRefundStatus",
    "paymentRefundMethod",
    "paymentMethod",
  ];

  // Decrypt each field
  Object.keys(document).forEach((key) => {
    if (nonEncryptedFields.includes(key)) return; // Skip non-encrypted fields

    if (typeof document[key] === "string") {
      try {
        document[key] = decrypt(document[key]);
      } catch (err) {
        console.error(`Failed to decrypt field ${key}: ${err.message}`);
      }
    } else if (typeof document[key] === "object" && document[key] !== null) {
      // Decrypt nested objects (like refundAccount)
      Object.keys(document[key]).forEach((nestedKey) => {
        if (typeof document[key][nestedKey] === "string") {
          try {
            document[key][nestedKey] = decrypt(document[key][nestedKey]);
          } catch (err) {
            console.error(`Failed to decrypt nested field ${nestedKey}: ${err.message}`);
          }
        }
      });
    }
  });

  return document;
};


const Payment = mongoose.model("Payment", PaymentModel);
module.exports = Payment;
