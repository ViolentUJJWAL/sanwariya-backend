const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [100, "Product title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    image: {
      public_id: {
        type: String,
        required: [true, "Image Public Id is required"],
      },
      url: {
        type: String,
        required: [true, "Image URL is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    variety: [
      {
        additionalDesc: {
          weigthInGrams: {
            type: Number,
            min: [0, "Weight is greater than 0"],
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
        },
      },
    ],
    reviews: [
      {
        ratedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "User are required"],
        },
        rating: {
          type: Number,
          validate: {
            validator: function (v) {
              return v.every((num) => num >= 1 && num <= 5);
            },
            message: "Each rating must be between 1 and 5",
          },
          required: [true, "Ratings are required"],
        },
        description: {
          type: String,
        },
        image: {
          type: [String],
          validate: {
            validator: function (v) {
              return v.every((url) =>
                /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
              );
            },
            message:
              "All images must be valid URLs ending with .jpg, .jpeg, .png, .webp, or .gif",
          },
        },
      },
    ],

    label: {
      type: String,
      enum: {
        values: ["best seller", "people's choice", "trending"],
        message: "Label must be one of: best seller, people's choice, trending",
      },
      required: [true, "Label is required"],
    },
    tag: [
      {
        type: String,
        required: [true, "Tag is required"],
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
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
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
