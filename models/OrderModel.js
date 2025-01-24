const mongoose = require("mongoose");


const OrderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        productVariety:{
          type: Object,
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    address: {
      flatNo: {
        type: String,
        required: [true, "Flat/House number is required"],
      },
      street: { type: String, required: [true, "Street/Colony is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      pincode: { type: String, required: [true, "Pincode is required"] },
      country: { type: String, required: [true, "Country is required"] },
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
    estimatedDeliveryDate: {
      type: Date,
      required: [true, "Estimated delivery date is required"],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "dispatch", "cancel", "delivered"],
        message: "Status must be one of: pending, dispatch, cancel, delivered",
      },
      required: [true, "Order status is required"],
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment ID is required"],
    },
    orderTrack: {
      dateAndTime: {
        type: Date,
      },
      location: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

OrderSchema.pre("save", function (next) {
  // Example: Automatically set an estimated delivery date if not provided
  if (!this.estimatedDeliveryDate) {
    const currentDate = new Date();
    this.estimatedDeliveryDate = new Date(
      currentDate.setDate(currentDate.getDate() + 7)
    ); // Default to 7 days later
  }

  console.log("About to save an order for user ID:", this.userId);
  next();
});

const Order = mongoose.model("Order", OrderSchema);
modules.export = Order;
