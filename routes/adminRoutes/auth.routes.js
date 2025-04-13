const { signup, signin, signout, sendOtp, verifyOtp, getProfile } = require("../../controllers/adminControllers/auth.controller");
const express = require("express");
const { isAdmin } = require("../../middleware/auth");
const router =  express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout",isAdmin, signout);
router.get("/profile",isAdmin, getProfile);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
module.exports = router