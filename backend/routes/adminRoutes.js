const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

// Simple admin check middleware
const adminOnly = (req, res, next) => {
    const role = req.user?.user_metadata?.role || req.user?.role;
    if (role !== "admin") {
        return res.status(403).json({ success: false, error: "Admin access required" });
    }
    next();
};

router.get("/admin/stats", authMiddleware, adminOnly, getDashboardStats);

module.exports = router;
