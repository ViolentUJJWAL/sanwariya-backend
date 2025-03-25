// routes/authRoutes.js
const router = require("express").Router();
const { body, query } = require("express-validator");
const authController = require("../../controllers/userControllers/auth.controller");
const { isAuth } = require("../../middleware/auth");

// Validation middleware for each route
router.post(
    "/register",
    [
        body("firstName")
            .trim()
            .notEmpty()
            .withMessage("First name is required")
            .isLength({ min: 3 })
            .withMessage("First name must be at least 3 characters"),
        body("lastName")
            .trim()
            .optional()
            .isLength({ min: 1 })
            .withMessage("Last name must be at least 1 character if provided"),
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters"),
        body("phoneNo")
            .optional()
            .matches(/^\d{10}$/)
            .withMessage("Phone number must be 10 digits if provided"),
    ],
    authController.register
);

router.get(
    "/verify-email",
    [
        body("token")
            .notEmpty()
            .withMessage("Verification token is required")
            .isLength({ min: 64, max: 64 })
            .withMessage("Invalid token format"),
    ],
    authController.verifyEmail
);

router.post(
    "/social-login",
    [
        body("provider")
            .notEmpty()
            .withMessage("Provider is required")
            .isIn(["google", "facebook", "apple"])
            .withMessage("Invalid provider"),
        body("id")
            .notEmpty()
            .withMessage("Social ID is required"),
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required"),
        body("firstName")
            .trim()
            .notEmpty()
            .withMessage("First name is required")
            .isLength({ min: 3 })
            .withMessage("First name must be at least 3 characters"),
        body("lastName")
            .trim()
            .optional()
            .isLength({ min: 1 })
            .withMessage("Last name must be at least 1 character if provided"),
    ],
    authController.socialLogin
);

router.post(
    "/login",
    [
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required"),
        body("password")
            .notEmpty()
            .withMessage("Password is required"),
        body("rememberMe")
            .optional()
            .isBoolean()
            .withMessage("Remember me must be a boolean"),
    ],
    authController.login
);

router.post(
    "/magic-link",
    [
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required"),
    ],
    authController.sendMagicLink
);

router.post(
    "/verify-magic-link",
    [
        body("token")
            .notEmpty()
            .withMessage("Magic link token is required")
            .isLength({ min: 64, max: 64 })
            .withMessage("Invalid token format"),
    ],
    authController.verifyMagicLink
);

router.post(
    "/forgot-password",
    [
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required"),
    ],
    authController.forgotPassword
);

router.post(
    "/reset-password",
    [
        body("token")
            .notEmpty()
            .withMessage("Reset token is required")
            .isLength({ min: 64, max: 64 })
            .withMessage("Invalid token format"),
        body("newPassword")
            .isLength({ min: 6 })
            .withMessage("New password must be at least 6 characters"),
    ],
    authController.resetPassword
);

router.get(
    "/profile",
    isAuth,
    authController.getProfile
);

router.post(
    "/logout",
    isAuth,
    authController.logout
);

// Error handling middleware for validation errors
router.use((req, res, next) => {
    const errors = require("express-validator").validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    next();
});

module.exports = router;