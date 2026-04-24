const express = require("express");
const router = express.Router();
const { signup, login, getProfile, logout } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/profile", authMiddleware, getProfile);
router.post("/auth/logout", authMiddleware, logout);

module.exports = router;
