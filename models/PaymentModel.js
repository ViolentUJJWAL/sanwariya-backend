const mongoose = require("mongoose");
const crypto = require("crypto");

const IV_LENGTH = parseInt(process.env.IV_LENGTH);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SPLIT = process.env.ENCRYPTION_SPLIT;

// Encryption function
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ENCRYPTION_SPLIT + encrypted;
}

// Decryption function
function decrypt(text) {
  const parts = text.split(ENCRYPTION_SPLIT);
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

//Paymet Model
const PaymentModel = new mongoose.Schema(
  {
    paymentBy: {
      type: mongoose.SchemaSchema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a payment by"],
    },
    paymentMethod: {
      enum: ["cash", "card", "UPI"],
      required: [true, "Please provide a payment method"],
    },
    paymentInfo: {
      type: String,
      required: [true, "Please provide a payment info"],
    },
    transactionId: {
      type: String,
      required: [true, "Please provide a transaction id"],
    },
    amount: {
      type: Number,
      required: [true, "Please provide an amount"],
    },
    transactionDateAndTime: {
      type: Date,
      required: [true, "Please provide a date and time"],
    },
    paymentStatus: {
      enum: ["pending", "paid", "unpaid", "refunded"],
      required: [true, "Please provide a payment status"],
    },
    refundAmount: {
      type: Number,
      required: [true, "Please provide a refund amount"],
    },
    paymentRefundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    paymentRefundMethod: {
      enum: ["card", "UPI", "bank"],
      type: String,
      required: [true, "Please provide a refund method"],
    },
    paymentRefundInfo: {
      type: String,
      required: [true, "Please provide a refund info"],
    },
    paymentRefundTransactionId: {
      type: String,
      required: [true, "Please provide a transaction id"],
    },
    paymentRefundDateAndTime: {
      type: Date,
      required: [true, "Please provide a date and time"],
    },
    paymentRefundStatus: {
      type: String,
      enum: ["pending", "refunded"],
      required: [true, "Please provide a refund status"],
    },
    refundAccount: {
      accountNumber: {
        type: String,
        required: [true, "Please provide an account number"],
        validate: {
          validator: function (v) {
            return /\d{9,18}/.test(v);
          },
          message: (props) => `${props.value} is not a valid account number!`,
        },
      },
      ifscCode: {
        type: String,
        required: [true, "Please provide an IFSC code"],
        uppercase: true,
        validate: {
          validator: function (v) {
            return /[A-Z]{4}0[A-Z0-9]{6}/.test(v);
          },
          message: (props) => `${props.value} is not a valid IFSC code!`,
        },
      },
      holderName: {
        type: String,
        required: [true, "Please provide a holder name"],
      },
      bankName: {
        type: String,
        required: [true, "Please provide a bank name"],
      },
    },
  },
  { timestamps: true }
);

// Middleware to encrypt fields before saving to MongoDB
PaymentModel.pre("save", function (next) {
    const document = this.toObject();
  
    // Fields to exclude from encryption
    const excludeFields = ["paymentBy", "paymentRefundBy"];
  
    // Encrypt each field except the excluded fields
    Object.keys(document).forEach((key) => {
      if (excludeFields.includes(key)) return; // Skip excluded fields
      if (
        typeof document[key] === "string" ||
        typeof document[key] === "number"
      ) {
        this[key] = encrypt(document[key].toString());
      } else if (typeof document[key] === "object" && document[key] !== null) {
        // Encrypt nested objects (like refundAccount)
        Object.keys(document[key]).forEach((nestedKey) => {
          if (typeof document[key][nestedKey] === "string") {
            this[key][nestedKey] = encrypt(document[key][nestedKey]);
          }
        });
      }
    });
  
    next();
  });
  

// Static method to decrypt fields after retrieving from MongoDB
PaymentModel.methods.decryptFields = function () {
  const document = this.toObject();

  // Decrypt each field
  Object.keys(document).forEach((key) => {
    if (typeof document[key] === "string") {
      document[key] = decrypt(document[key]);
    } else if (typeof document[key] === "object" && document[key] !== null) {
      // Decrypt nested objects (like refundAccount)
      Object.keys(document[key]).forEach((nestedKey) => {
        if (typeof document[key][nestedKey] === "string") {
          document[key][nestedKey] = decrypt(document[key][nestedKey]);
        }
      });
    }
  });

  return document;
};

const Payment = mongoose.model("Payment", PaymentModel);
module.exports = Payment;
