const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    otp: {
      type: String,
    },
    expairyOtp: {
      type: Date,
    },
  },
  { timestamps: true }
);

AdminSchema.pre("save", function (next) {
  if(!this.isModified("password")) {
    this.password = bcrypt.hashSync(this.password, parseInt(process.env.PASSWORD_SALT));
    return next();
  }
});

AdminSchema.methods.comparePassword = function (plaintext) {
  return bcrypt.compareSync(plaintext, this.password);
}

AdminSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
}


const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
