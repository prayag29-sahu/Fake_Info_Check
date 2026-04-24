const express = require("express");
const router = express.Router();
const { checkText } = require("../controllers/textController");
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
    "/text/check",
    authMiddleware,
    [
        body("text")
            .trim()
            .isLength({ min: 10, max: 10000 })
            .withMessage("Text must be between 10 and 10000 characters"),
    ],
    validate,
    checkText
);

module.exports = router;
