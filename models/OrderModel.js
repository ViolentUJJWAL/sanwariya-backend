const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        productVariety: {
          type: Object, // e.g., color, size
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity cannot be less than 1"],
        },
        totalPrice: {
          type: Number,
          required: [true, "Total price is required"],
          min: [0, "Total price cannot be negative"],
        },
      },
    ],

    address: {
      flatNo: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true },
      description: { type: String },
      category: {
        type: String,
        enum: ["home", "work", "other"],
        default: "other",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    payableAmount: {
      type: Number,
      required: [true, "Payable amount is required"],
      min: [0, "Payable amount cannot be negative"],
    },

    discount: {
      code: { type: String },
      amount: { type: Number, min: 0 },
    },

    shipping: {
      method: {
        type: String,
        enum: ["standard", "express"],
        default: "standard",
      },
      cost: { type: Number, min: 0, required: true },
      trackingNumber: { type: String },
    },

    estimatedDeliveryDate: {
      type: Date,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    status: {
      type: String,
      // enum: ["pending", "dispatch", "cancel", "delivered"],
      enum: ["pending", "processing", "shipped", "cancelled", "completed"],
      required: [true, "Order status is required"],
      default: "pending"
    },

    orderTrack: {
      dateAndTime: { type: Date },
      location: { type: String },
    },

    refund: {
      isRefunded: { type: Boolean, default: false },
      amount: { type: Number, min: 0 },
      reason: { type: String },
      refundedAt: { type: Date },
    },
    customerNote: {
      type: String,
      maxlength: 500,
    },
    adminNote: {
      type: String,
    },
    giftOptions: {
      isGift: { type: Boolean, default: false },
      message: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-generate a unique 10-digit orderNumber if not provided
OrderSchema.pre("save", async function (next) {
  console.log("save")
  if (!this.orderNumber) {
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
      const orderNumber = `ORD-${randomDigits}`;
      
      const existingOrder = await mongoose.model("Order").findOne({ orderNumber });
      if (!existingOrder) {
        this.orderNumber = orderNumber;
        isUnique = true;
      }
    }
    console.log("save", this.orderNumber)
  }
  
  if (!this.estimatedDeliveryDate) {
    const currentDate = new Date();
    this.estimatedDeliveryDate = new Date(
      currentDate.setDate(currentDate.getDate() + 7)
    ); // Default to 7 days later
    console.log("save", this.estimatedDeliveryDate)
  }

  next();
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
