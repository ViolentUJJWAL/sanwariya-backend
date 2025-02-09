const express = require("express");
const { body, query } = require("express-validator");
const adminController = require("../../controllers/adminControllers/products.controller");
const { isAdmin } = require("../../middleware/auth");
const {
  productValidation,
  reviewValidation,
} = require("../../utils/validation");

const router = express.Router();

// Admin Product Management Routes
router.post(
  "/products",
  isAdmin,
  productValidation,
  adminController.createProduct
);
router.put(
  "/products/:productId",
  isAdmin,
  productValidation,
  adminController.updateProduct
);
router.delete("/products/:productId", isAdmin, adminController.deleteProduct);
router.patch(
  "/products/:productId/status",
  isAdmin,
  adminController.updateProductStatus
);
router.patch(
  "/products/:productId/variety/:varietyId/stock",
  isAdmin,
  body("stock").isInt({ min: 0 }),
  adminController.updateStock
);
router.patch(
  "/products/:productId/variety/:varietyId/price",
  isAdmin,
  body("mrp").optional().isFloat({ min: 0 }),
  body("sellingPrice").optional().isFloat({ min: 0 }),
  adminController.updatePrice
);
router.get(
  "/products",
  isAdmin,
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  adminController.getAllProducts
);

// Admin Review Management Routes
router.put(
  "/products/:productId/reviews/:reviewId",
  isAdmin,
  reviewValidation,
  adminController.updateReview
);
router.delete(
  "/products/:productId/reviews/:reviewId",
  isAdmin,
  adminController.deleteReview
);

// Admin Product Stats
router.get("/products/stats", isAdmin, adminController.getProductStats);

module.exports = router;
