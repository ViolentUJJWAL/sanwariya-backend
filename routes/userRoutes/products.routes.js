const express = require("express");
const { param, query, body } = require("express-validator");
const userController = require("../../controllers/userControllers/products.controller");
const { isAuth } = require("../../middleware/auth");
const { reviewValidation } = require("../../utils/validation");

const router = express.Router();

// User Product Routes
router.get(
  "/products",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("category").optional().trim(),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("sort")
    .optional()
    .isIn(["price", "-price", "rating", "-rating", "newest"]),
  userController.getAllProducts
);
router.get("/products/:productId", userController.getProduct);
router.get(
  "/products/category/:category",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  userController.getProductsByCategory
);
router.get(
  "/products/label/:label",
  param("label").isIn([
    "best seller",
    "people's choice",
    "trending",
    "new arrival",
    "limited edition",
  ]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  userController.getProductsByLabel
);
router.get(
  "/products/search",
  query("q").trim().notEmpty(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  userController.searchProducts
);

// User Review Routes
router.post(
  "/products/:productId/reviews",
  isAuth,
  reviewValidation,
  userController.addReview
);
router.put(
  "/products/:productId/reviews/:reviewId",
  isAuth,
  reviewValidation,
  userController.updateUserReview
);
router.delete(
  "/products/:productId/reviews/:reviewId",
  isAuth,
  userController.deleteUserReview
);

module.exports = router;
