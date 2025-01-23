import mongoose from "mongoose";
const AdminSchema = mongoose.Schema(
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
  },
  { timestamps: true }
);
const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
