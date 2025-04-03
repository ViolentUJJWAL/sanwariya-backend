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

// Create Product API
exports.createProduct = async (req, res) => {
  console.log('req.body', req.body)
  try {
    if (!handleValidationErrors(req, res)) {


      const images = req.files && req.files.length > 0
        ? req.files.map(file => ({
          public_id: file.filename,
          url: file.path,
        }))
        : [];

      const {
        title,
        description,
        category,
        variety, // Expecting this as a JSON string if sent via form-data
        labels,  // Expecting this as a JSON string if sent via form-data
        tags,    // Expecting this as a JSON string if sent via form-data
      } = req.body;

      // Parse JSON strings if they come from form-data
      const parsedVariety = variety ? JSON.parse(variety) : [];
      const parsedLabels = labels ? JSON.parse(labels) : [];
      const parsedTags = tags ? JSON.parse(tags) : [];

      const product = new Product({
        title,
        description,
        images,
        category,
        variety: parsedVariety,
        labels: parsedLabels,
        tags: parsedTags,
        active: true,
        isDeleted: false,
        sales: 0,
        searchScore: 0,
      });

      await product.save();

      res.status(201).json({
        success: true,
        data: product,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }

};

// Update Product API (Partial Update)
exports.updateProduct = async (req, res) => {
  console.log('req.body', req.body)
  try {
    handleValidationErrors(req, res);

    const { productId } = req.params;
    console.log('productId', productId)
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Handle image updates
    let updatedImages = [...product.images]; // Start with existing images
    if (req.files && req.files.length > 0) {
      // Add new images from Cloudinary upload
      const newImages = req.files.map(file => ({
        public_id: file.filename,
        url: file.path,
      }));
      updatedImages = [...updatedImages, ...newImages]; // Append new images
    }

    // Build update object with only provided fields
    const updateData = {};
    const fieldsToUpdate = [
      'title',
      'description',
      'category',
      'variety',
      'labels',
      'tags',
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        // Parse JSON strings for array fields if sent via form-data
        if (['variety', 'labels', 'tags'].includes(field)) {
          updateData[field] = typeof req.body[field] === 'string'
            ? JSON.parse(req.body[field])
            : req.body[field];
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Add images to update data if new images were uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = updatedImages;
    }

    // Perform partial update
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found after update',
      });
    }

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


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