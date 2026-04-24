const express = require("express");
const router = express.Router();
const { checkImage } = require("../controllers/imageController");
const authMiddleware = require("../middleware/authMiddleware");
const { imageUpload } = require("../middleware/uploadMiddleware");

router.post(
    "/image/check",
    authMiddleware,
    imageUpload.single("image"),
    checkImage
);

module.exports = router;
