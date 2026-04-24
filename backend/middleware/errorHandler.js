const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.path} — ${err.message}`);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
};

module.exports = errorHandler;
