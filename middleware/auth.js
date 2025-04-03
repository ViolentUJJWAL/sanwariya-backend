const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema'); // Adjust the path as needed
const Admin = require('../models/AdminModel'); // Adjust the path as needed

// Middleware to check if the request is from an authenticated user
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1] ;

    console.log('token', token)
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token structure.",
      });
    }

    // Fetch user, excluding sensitive fields
    const user = await User.findById(decoded.id).select("-password -resetToken -resetTokenExpires");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    const errorMessage =
      error.name === "TokenExpiredError" ? "Token has expired." :
      error.name === "JsonWebTokenError" ? "Invalid token." :
      "Unauthorized. Authentication failed.";

    return res.status(401).json({ success: false, message: errorMessage });
  }
};

// Middleware to check if the request is from an authenticated admin
const isAdmin = async (req, res, next) => {
  try {
    console.log('req.cookies', req.cookies)
    const token =  req.cookies?.token || req.headers.authorization?.split(" ")[1] ;

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Invalid token or admin not found." });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
  }
};

module.exports = { isAuth, isAdmin };
