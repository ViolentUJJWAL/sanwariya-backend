const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [100, "Product title cannot exceed 100 characters"],
      index: true, // Added index for better search performance
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    images: [{
      public_id: {
        type: String,
        required: [true, "Image Public Id is required"],
      },
      url: {
        type: String,
        required: [true, "Image URL is required"],
      },
    }],
    category: {
      type: String,
      required: [true, "Category is required"],
      index: true, // Added index for category-based queries
    },
    variety: [
      {
        additionalDesc: {
          weightInGrams: {
            type: Number,
            min: [0, "Weight must be greater than 0"],
          },
          color: {
            type: String,
          },
          size: {
            type: String,
          }
        },
        stock: {
          type: Number,
          required: [true, "Stock is required"],
          min: [0, "Stock cannot be negative"],
        },
        price: {
          mrp: {
            type: Number,
            required: [true, "MRP is required"],
            min: [0, "MRP cannot be negative"],
          },
          sellingPrice: {
            type: Number,
            required: [true, "Selling price is required"],
            min: [0, "Selling price cannot be negative"],
            validate: {
              validator: function (v) {
                return v <= this.price.mrp;
              },
              message: "Selling price cannot be greater than MRP",
            },
          },
          discountPercentage: {
            type: Number,
            default: function() {
              return Math.round(((this.price.mrp - this.price.sellingPrice) / this.price.mrp) * 100);
            }
          }
        },
        isActive: {
          type: Boolean,
          default: true
        }
      },
    ],
    reviews: [
      {
        ratedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "User is required"],
        },
        rating: {
          type: Number,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating cannot exceed 5"],
          required: [true, "Rating is required"],
        },
        description: {
          type: String,
        },
        images: [{
          public_id: {
            type: String,
            required: [true, "Review image Public Id is required"],
          },
          url: {
            type: String,
            required: [true, "Review image URL is required"],
            validate: {
              validator: function (url) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
              },
              message: "Image URL must be valid and end with .jpg, .jpeg, .png, .webp, or .gif",
            },
          },
        }],
        isVerified: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      },
    ],
    avgRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    labels: [{
      type: String,
      enum: ["best seller", "people's choice", "trending", "new arrival", "limited edition"],
      required: true
    }],
    tags: [{
      type: String,
      required: [true, "Tag is required"],
      maxlength: [50, "Tag cannot exceed 50 characters"],
    }],
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    sales: {
      type: Number,
      default: 0,
    },
    searchScore: {
      type: Number,
      default: 0  // For implementing trending products based on views, sales, and reviews
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ labels: 1 });
ProductSchema.index({ searchScore: -1 });
ProductSchema.index({ avgRating: -1 });
ProductSchema.index({ sales: -1 });

// Update average rating when a review is added/modified
ProductSchema.methods.updateAverageRating = async function() {
  const reviews = this.reviews;
  if (reviews.length === 0) {
    this.avgRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    this.avgRating = Math.round((sum / reviews.length) * 10) / 10;
    this.totalReviews = reviews.length;
  }
  await this.save();
};

// Update search score periodically (can be called by a cron job)
ProductSchema.methods.updateSearchScore = async function() {
  const WEIGHTS = {
    sales: 0.4,
    reviews: 0.3,
    rating: 0.3
  };
  
  this.searchScore = (
    (this.sales * WEIGHTS.sales) +
    (this.totalReviews * WEIGHTS.reviews) +
    (this.avgRating * WEIGHTS.rating)
  );
  
  await this.save();
};

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;