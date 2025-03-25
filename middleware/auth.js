const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema'); // Adjust the path as needed
const Admin = require('../models/AdminModel'); // Adjust the path as needed

// Middleware to check if the request is from an authenticated user
const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if decoded payload contains 'id' (matches token generation in User model)
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
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Generic error fallback
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Authentication failed.",
    });
  }
};

// Middleware to check if the request is from an authenticated admin
const isAdmin = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid token or admin not found.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
  }
};

module.exports = { isAuth, isAdmin };
