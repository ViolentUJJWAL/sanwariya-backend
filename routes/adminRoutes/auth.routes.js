const { signup, signin, signout } = require("../../controllers/adminControllers/auth.controller");
const express = require("express")
const router =  express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout", signout);
module.exports = router