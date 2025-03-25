// adminProductController.js
const { validationResult } = require('express-validator');
const Product = require('../../models/ProductModel');
const { cloudinary, upload } = require('../../utils/cloudinaryConfig'); //
// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return false
};

// Create Product APIc
// Delete Product (Soft Delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isDeleted = true;
    product.active = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Product Status
exports.updateProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.active = !product.active;
    await product.save();

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  try {
    handleValidationErrors(req, res);

    const { stock } = req.body;

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        'variety._id': req.params.varietyId,
      },
      {
        $set: {
          'variety.$.stock': stock,
        },
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or variety not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Price
exports.updatePrice = async (req, res) => {
  try {
    handleValidationErrors(req, res);

    const { mrp, sellingPrice } = req.body;

    const updateData = {};
    if (mrp !== undefined) updateData['variety.$.price.mrp'] = mrp;
    if (sellingPrice !== undefined) updateData['variety.$.price.sellingPrice'] = sellingPrice;

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        'variety._id': req.params.varietyId,
      },
      {
        $set: updateData,
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or variety not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, label } = req.query;

    const query = { isDeleted: false };
    if (category) query.category = category;
    if (label) query.labels = label;

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Review
exports.updateReview = async (req, res) => {
  try {
    handleValidationErrors(req, res);

    const { rating, description, images, isVerified } = req.body;

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        'reviews._id': req.params.reviewId,
      },
      {
        $set: {
          'reviews.$': {
            rating,
            description,
            images,
            isVerified: isVerified !== undefined ? isVerified : true,
            _id: req.params.reviewId,
            ratedBy: req.body.ratedBy || undefined, // Assuming ratedBy can't be updated
            createdAt: req.body.createdAt || undefined, // Assuming createdAt can't be updated
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or review not found',
      });
    }

    await product.updateAverageRating();

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        $pull: { reviews: { _id: req.params.reviewId } },
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product or review not found',
      });
    }

    await product.updateAverageRating();

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Product Stats
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalSales: { $sum: '$sales' },
          averageRating: { $avg: '$avgRating' },
          totalReviews: { $sum: '$totalReviews' },
          categoryCounts: {
            $push: {
              category: '$category',
              count: 1,
            },
          },
        },
      },
    ]);

    const topSelling = await Product.find({ isDeleted: false })
      .sort({ sales: -1 })
      .limit(5);

    const topRated = await Product.find({ isDeleted: false })
      .sort({ avgRating: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        generalStats: stats[0] || {
          totalProducts: 0,
          totalSales: 0,
          averageRating: 0,
          totalReviews: 0,
          categoryCounts: [],
        },
        topSelling,
        topRated,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};