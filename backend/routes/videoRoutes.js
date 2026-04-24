const express = require("express");
const router = express.Router();
const { checkVideo } = require("../controllers/videoController");
const authMiddleware = require("../middleware/authMiddleware");
const { videoUpload } = require("../middleware/uploadMiddleware");

router.post(
    "/video/check",
    authMiddleware,
    videoUpload.single("video"),
    checkVideo
);

module.exports = router;
