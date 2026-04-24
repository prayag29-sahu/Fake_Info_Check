const express = require("express");
const router = express.Router();
const { checkDocument } = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");
const { documentUpload } = require("../middleware/uploadMiddleware");

router.post(
    "/document/check",
    authMiddleware,
    documentUpload.single("document"),
    checkDocument
);

module.exports = router;
