const express = require("express");
const { body, query } = require("express-validator");
const adminController = require("../../controllers/adminControllers/products.controller");
const { isAdmin } = require("../../middleware/auth");
const {
  productValidation,
  reviewValidation,
} = require("../../utils/validation");
const { upload } = require("../../utils/cloudinaryConfig");

const router = express.Router();

// Admin Product Management Routes
router.post(
  "/",
  isAdmin,
  upload.array('images', 10),
  productValidation,
  adminController.createProduct
);
router.put(
  "/:productId",
  isAdmin,
  upload.array('images', 10),
  adminController.updateProduct
);
router.get("/:id", adminController.getProductById);

router.delete("/:productId", isAdmin, adminController.deleteProduct);
router.patch(
  "/:productId/status",
  isAdmin,
  adminController.updateProductStatus
);
router.patch(
  "/:productId/variety/:varietyId/stock",
  isAdmin,
  body("stock").isInt({ min: 0 }),
  adminController.updateStock
);
router.patch(
  "/:productId/variety/:varietyId/price",
  isAdmin,
  body("mrp").optional().isFloat({ min: 0 }),
  body("sellingPrice").optional().isFloat({ min: 0 }),
  adminController.updatePrice
);
router.get(
  "/",
  isAdmin,
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  adminController.getAllProducts
);

// Admin Review Management Routes
router.put(
  "/:productId/reviews/:reviewId",
  isAdmin,
  reviewValidation,
  adminController.updateReview
);
router.delete(
  "/:productId/reviews/:reviewId",
  isAdmin,
  adminController.deleteReview
);

// Admin Product Stats
router.get("/stats", isAdmin, adminController.getProductStats);

module.exports = router;
