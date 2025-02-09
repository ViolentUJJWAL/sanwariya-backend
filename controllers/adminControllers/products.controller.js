// adminProductController.js
const { validationResult } = require('express-validator');
const Product = require('../../models/ProductModel');

const adminController = {
  createProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = new Product(req.body);
      await product.save();
      
      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.productId,
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      product.isDeleted = true;
      product.active = false;
      await product.save();

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  updateProductStatus: async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      product.active = !product.active;
      await product.save();

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  updateStock: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.productId,
          'variety._id': req.params.varietyId
        },
        {
          $set: {
            'variety.$.stock': req.body.stock
          }
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product or variety not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

 // adminProductController.js (continued)
 updatePrice: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = {};
      if (req.body.mrp) updateData['variety.$.price.mrp'] = req.body.mrp;
      if (req.body.sellingPrice) updateData['variety.$.price.sellingPrice'] = req.body.sellingPrice;

      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.productId,
          'variety._id': req.params.varietyId
        },
        {
          $set: updateData
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product or variety not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {};
      if (req.query.category) query.category = req.query.category;
      if (req.query.label) query.labels = req.query.label;

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
          totalItems: total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  updateReview: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.productId,
          'reviews._id': req.params.reviewId
        },
        {
          $set: {
            'reviews.$': {
              ...req.body,
              isVerified: true,
              _id: req.params.reviewId
            }
          }
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product or review not found'
        });
      }

      await product.updateAverageRating();

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.productId,
        {
          $pull: { reviews: { _id: req.params.reviewId } }
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product or review not found'
        });
      }

      await product.updateAverageRating();

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getProductStats: async (req, res) => {
    try {
      const stats = await Product.aggregate([
        {
          $match: { isDeleted: false }
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
                count: 1
              }
            }
          }
        }
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
          generalStats: stats[0],
          topSelling,
          topRated
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = adminController;