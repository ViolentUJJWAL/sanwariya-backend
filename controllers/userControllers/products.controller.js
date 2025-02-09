// userProductController.js
const { validationResult } = require('express-validator');
const Product = require('../../models/ProductModel');

const userController = {
  getAllProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {
        active: true,
        isDeleted: false
      };

      // Apply filters
      if (req.query.category) query.category = req.query.category;
      if (req.query.minPrice) query['variety.price.sellingPrice'] = { $gte: parseFloat(req.query.minPrice) };
      if (req.query.maxPrice) query['variety.price.sellingPrice'] = { ...query['variety.price.sellingPrice'], $lte: parseFloat(req.query.maxPrice) };

      // Determine sort order
      let sort = { createdAt: -1 };
      if (req.query.sort) {
        switch (req.query.sort) {
          case 'price':
            sort = { 'variety.price.sellingPrice': 1 };
            break;
          case '-price':
            sort = { 'variety.price.sellingPrice': -1 };
            break;
          case 'rating':
            sort = { avgRating: 1 };
            break;
          case '-rating':
            sort = { avgRating: -1 };
            break;
          case 'newest':
            sort = { createdAt: -1 };
            break;
        }
      }

      const products = await Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort);

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

  getProduct: async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.productId,
        active: true,
        isDeleted: false
      }).populate('reviews.ratedBy', 'name avatar');

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

  getProductsByCategory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {
        category: req.params.category,
        active: true,
        isDeleted: false
      };

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

  getProductsByLabel: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {
        labels: req.params.label,
        active: true,
        isDeleted: false
      };

      const products = await Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ searchScore: -1 });

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

  searchProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {
        $text: { $search: req.query.q },
        active: true,
        isDeleted: false
      };

      const products = await Product.find(query, {
        score: { $meta: 'textScore' }
      })
        .skip(skip)
        .limit(limit)
        .sort({ score: { $meta: 'textScore' } });

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

  addReview: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findOne({
        _id: req.params.productId,
        active: true,
        isDeleted: false
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user has already reviewed
      const existingReview = product.reviews.find(
        review => review.ratedBy.toString() === req.user._id.toString()
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      product.reviews.push({
        ...req.body,
        ratedBy: req.user._id
      });

      await product.save();
      await product.updateAverageRating();

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

  updateUserReview: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.productId,
          'reviews._id': req.params.reviewId,
          'reviews.ratedBy': req.user._id
        },
        {
          $set: {
            'reviews.$': {
              ...req.body,
              ratedBy: req.user._id,
              _id: req.params.reviewId
            }
          }
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or not authorized'
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

  deleteUserReview: async (req, res) => {
    try {
      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.productId,
          'reviews._id': req.params.reviewId,
          'reviews.ratedBy': req.user._id
        },
        {
          $pull: { reviews: { _id: req.params.reviewId } }
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or not authorized'
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
  }
};

module.exports = userController;