const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema'); // Adjust the path as needed
const Admin = require('../models/AdminModel'); // Adjust the path as needed

// Middleware to check if the request is from an authenticated user
const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) return res.status(401).json({ message: 'Invalid token or user not found.' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
  }
};

// Middleware to check if the request is from an authenticated admin
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password');

    if (!admin) return res.status(401).json({ message: 'Invalid token or admin not found.' });

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
  }
};

module.exports = { isAuth, isAdmin };
