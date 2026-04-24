const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({ success: false, error: "Invalid or expired token" });
        }

        req.user = data.user;
        next();
    } catch (err) {
        logger.error("Auth middleware error:", err);
        res.status(500).json({ success: false, error: "Authentication error" });
    }
};

module.exports = authMiddleware;
