const express = require("express");
const router = express.Router();
const { checkURL } = require("../controllers/urlController");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

router.post(
    "/url/check",
    authMiddleware,
    [body("url").trim().isURL({ require_protocol: true }).withMessage("Must be a valid URL with protocol (http/https)")],
    validate,
    checkURL
);

module.exports = router;
