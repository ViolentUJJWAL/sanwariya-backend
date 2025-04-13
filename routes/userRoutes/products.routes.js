const express = require("express");
const { param, query, body } = require("express-validator");
const userController = require("../../controllers/userControllers/products.controller");
const { isAuth } = require("../../middleware/auth");
const { reviewValidation } = require("../../utils/validation");

const router = express.Router();

// User Product Routes
router.get(
  "",
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
router.get("/:productId", userController.getProduct);
router.get(
  "/category/:category",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  userController.getProductsByCategory
);
router.get(
  "/label/:label",
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
  "/search",
  query("q").trim().notEmpty(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  userController.searchProducts
);

// User Review Routes
router.post(
  "/:productId/reviews",
  isAuth,
  reviewValidation,
  userController.addReview
);
router.put(
  "/:productId/reviews/:reviewId",
  isAuth,
  reviewValidation,
  userController.updateUserReview
);
router.delete(
  "/products/:productId/reviews/:reviewId",
  isAuth,
  userController.deleteUserReview
);
router.post("/wishlist/add", isAuth, userController.addToWishlist);
router.post("/wishlist/remove", isAuth, userController.removeFromWishlist

);
router.post("/cart/add", isAuth, userController.addToCart);
router.post("/cart/remove", isAuth, userController.removeFromCart
);
module.exports = router;
