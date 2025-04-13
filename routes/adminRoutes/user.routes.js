const express = require("express");
const { getAllUsers, getUserById } = require("../../controllers/adminControllers/user.controller");
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');

router.get("/", isAdmin, getAllUsers);
router.get("/:id", isAdmin, getUserById);

module.exports = router;
