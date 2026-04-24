const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { data, error } = await supabaseAdmin
            .from("scan_history")
            .select(`
                id,
                scan_type,
                input_summary,
                overall_verdict,
                confidence,
                status,
                created_at,
                scan_results (
                    verdict,
                    confidence,
                    indicators
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (err) {
        logger.error("Get history error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from("scan_history")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;

        res.json({ success: true, message: "Scan deleted" });
    } catch (err) {
        logger.error("Delete history error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
