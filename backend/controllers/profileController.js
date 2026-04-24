const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.getProfile = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", req.user.id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        logger.error("Get profile error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, avatar_url } = req.body;

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
            .eq("id", req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        logger.error("Update profile error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
