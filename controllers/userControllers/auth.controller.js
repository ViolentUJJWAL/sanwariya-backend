// controllers/authController.js
const User = require("../../models/UserSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/sendMail");
const crypto = require("crypto");

const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNo } = req.body;

        if (!firstName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "First name, email, and password are required",
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const user = new User({
            email,
            password,
            fullName: { firstName, lastName },
            phoneNo,
        });
        const token = crypto.randomBytes(32).toString("hex");
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();
        const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
        await sendEmail(email, "Verify Your Email", `Click here to verify: ${verificationLink}`);

        res.status(201).json({
            success: true,
            data: { userId: user._id, message: "Verification email sent" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        console.log('token', token)
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required",
            });
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        user.isVerified = true;
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({
            success: true,
            data: { token: jwtToken, message: "Email verified" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const socialLogin = async (req, res) => {
    try {
        const { provider, id, email, firstName, lastName } = req.body;

        if (!provider || !id || !email) {
            return res.status(400).json({
                success: false,
                message: "Provider, ID, and email are required",
            });
        }

        let user = await User.findOne({ "socialLogin.id": id, "socialLogin.provider": provider });
        if (!user) {
            user = new User({
                email,
                fullName: { firstName, lastName },
                socialLogin: { provider, id },
                isVerified: true,
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({
            success: true,
            data: { token, user: user.toObject({ getters: true }) },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    console.log('req.body', req.body)
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email }).select("+password");
        console.log('user', user)
        if (!user) { // Check if user is null
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        if (!user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email not verified",
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? "30d" : "1d",
        });

        res.status(200).json({
            success: true,
            data: { token, user: user.toObject({ getters: true }) },
        });
    } catch (error) {
        console.log('error', error)
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const sendMagicLink = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const magicLink = `${process.env.APP_URL}/login?token=${token}`;
        await sendEmail(email, "Magic Login Link", `Click to login: ${magicLink}`);

        res.status(200).json({
            success: true,
            data: { message: "Magic link sent" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const verifyMagicLink = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required",
            });
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({
            success: true,
            data: { token: jwtToken, user: user.toObject({ getters: true }) },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        user.resetToken = token;
        user.resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
        await sendEmail(email, "Reset Password", `Click to reset: ${resetLink}`);

        res.status(200).json({
            success: true,
            data: { message: "Reset link sent" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required",
            });
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            data: { message: "Password reset successful" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(id).select("-password -resetToken -resetTokenExpires");
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const logout = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        res.status(200).json({
            success: true,
            data: { message: "Logged out successfully" },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    register,
    verifyEmail,
    socialLogin,
    login,
    sendMagicLink,
    verifyMagicLink,
    forgotPassword,
    resetPassword,
    getProfile,
    logout,
};