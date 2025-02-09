const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    phoneNo: {
      type: String,
      required: [true, "Phone number is required"],
      min: [10, "Mobile Number must be 10 Digits"],
      max: [10, "Mobile Number must be 10 Digits"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be a valid email address"],
    },
    password: {
      type: Number,
      required: [true, "Password is required"],
    },
    fullName: {
      firstName: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minLength: [3, "Name length must greater than 3"],
      },
      lastName: {
        type: String,
        trim: true,
      },
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity cannot be less than 1"],
        },
      },
    ],
    address: [
      {
        street: { type: String, required: [true, "Street is required"] },
        flatNo: {
          type: String,
          required: [true, "Flat/House number is required"],
        },
        city: { type: String, required: [true, "City is required"] },
        pincode: { type: String, required: [true, "Pincode is required"] },
        state: { type: String, required: [true, "State is required"] },
        description: { type: String },
        category: {
          type: String,
          enum: ["home", "work", "other"],
          default: "other",
        },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if(!this.isModified("password")) {
    this.password = bcrypt.hashSync(this.password, parseInt(process.env.PASSWORD_SALT));
    return next();
  }
});

UserSchema.methods.comparePassword = function (plaintext) {
  return bcrypt.compareSync(plaintext, this.password);
}

UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
}

const User = mongoose.model("User", UserSchema);
module.exports = User;
