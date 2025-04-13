// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be a valid email address"],
    },
    password: {
      type: String,
      required: function () {
        return !this.socialLogin; // Required only for non-social-login users
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Exclude from queries by default
    },
    phoneNo: {
      type: Number,
      sparse: true, // Allows null/undefined without unique constraint issues
      trim: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
      default: null,
    },
    fullName: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [3, "First name must be at least 3 characters"],
      },
      lastName: {
        type: String,
        trim: true,
        minlength: [1, "Last name must be at least 1 character if provided"],
        default: "",
      },
    },
    socialLogin: {
      provider: {
        type: String,
        enum: ["google", "facebook", "apple"],
        default: null,
      },
      id: {
        type: String,
        default: null,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      select: false, // Exclude from queries
      default: null,
    },
    resetTokenExpires: {
      type: Date,
      select: false, // Exclude from queries
      default: null,
    },
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    cart: {
      type: [
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
            default: 1,
          },
        },
      ],
      default: [],
    },
    address: {
      type: [
        {
          street: {
            type: String,
            trim: true,
            default: "",
          },
          flatNo: {
            type: String,
            trim: true,
            default: "",
          },
          city: {
            type: String,
            trim: true,
            default: "",
          },
          pincode: {
            type: String,
            trim: true,
            match: [/^\d{6}$/, "Pincode must be 6 digits"],
            default: "",
          },
          state: {
            type: String,
            trim: true,
            default: "",
          },
          description: {
            type: String,
            trim: true,
            default: "",
          },
          category: {
            type: String,
            enum: ["home", "work", "other"],
            default: "other",
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = function (plaintext) {
  return bcrypt.compareSync(plaintext, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateToken = function (longLived = false) {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: longLived ? "30d" : "1d",
  });
};

module.exports = mongoose.model("User", UserSchema);