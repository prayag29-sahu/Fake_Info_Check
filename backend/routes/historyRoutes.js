const express = require("express");
const router = express.Router();
const { getHistory, deleteHistory } = require("../controllers/historyController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/history", authMiddleware, getHistory);
router.delete("/history/:id", authMiddleware, deleteHistory);

module.exports = router;
