// userProductController.js
const { validationResult } = require("express-validator");
const Product = require("../../models/ProductModel");
const User = require("../../models/User"); // Assuming User model is in this path

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      active: true,
      isDeleted: false,
    };

    if (req.query.category) query.category = req.query.category;
    if (req.query.minPrice) query["variety.price.sellingPrice"] = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) {
      query["variety.price.sellingPrice"] = {
        ...query["variety.price.sellingPrice"],
        $lte: parseFloat(req.query.maxPrice),
      };
    }

    let sort = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case "price":
          sort = { "variety.price.sellingPrice": 1 };
          break;
        case "-price":
          sort = { "variety.price.sellingPrice": -1 };
          break;
        case "rating":
          sort = { avgRating: 1 };
          break;
        case "-rating":
          sort = { avgRating: -1 };
          break;
        case "newest":
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

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      active: true,
      isDeleted: false,
    }).populate("reviews.ratedBy", "fullName.firstName fullName.lastName avatar");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
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

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      category: req.params.category,
      active: true,
      isDeleted: false,
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

// Get products by label
const getProductsByLabel = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      labels: req.params.label,
      active: true,
      isDeleted: false,
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

// Search products
const searchProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $text: { $search: req.query.q },
      active: true,
      isDeleted: false,
    };

    const products = await Product.find(query, {
      score: { $meta: "textScore" },
    })
      .skip(skip)
      .limit(limit)
      .sort({ score: { $meta: "textScore" } });

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

// Add review
const addReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const product = await Product.findOne({
      _id: req.params.productId,
      active: true,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingReview = product.reviews.find(
      (review) => review.ratedBy.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    product.reviews.push({
      ...req.body,
      ratedBy: req.user._id,
    });

    await product.save();
    await product.updateAverageRating();

    res.status(201).json({
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

// Update user review
const updateUserReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        "reviews._id": req.params.reviewId,
        "reviews.ratedBy": req.user._id,
      },
      {
        $set: {
          "reviews.$": {
            ...req.body,
            ratedBy: req.user._id,
            _id: req.params.reviewId,
          },
        },
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
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

// Delete user review
const deleteUserReview = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.productId,
        "reviews._id": req.params.reviewId,
        "reviews.ratedBy": req.user._id,
      },
      {
        $pull: { reviews: { _id: req.params.reviewId } },
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    await product.updateAverageRating();

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      active: true,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const qty = parseInt(quantity) || 1;

    const product = await Product.findOne({
      _id: productId,
      active: true,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await User.findById(req.user._id);
    const existingItem = user.cart.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({ productId, quantity: qty });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const user = await User.findById(req.user._id);
    const itemIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Product not in cart",
      });
    }

    user.cart.splice(itemIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  getProductsByCategory,
  getProductsByLabel,
  searchProducts,
  addReview,
  updateUserReview,
  deleteUserReview,
  addToWishlist,
  removeFromWishlist,
  addToCart,
  removeFromCart,
};