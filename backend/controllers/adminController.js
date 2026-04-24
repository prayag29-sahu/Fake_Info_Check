const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.getDashboardStats = async (req, res) => {
    try {
        const [usersRes, scansRes, verdictRes] = await Promise.all([
            supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("scan_history").select("id", { count: "exact", head: true }),
            supabaseAdmin
                .from("scan_history")
                .select("overall_verdict, scan_type, created_at")
                .order("created_at", { ascending: false })
                .limit(500),
        ]);

        const totalUsers = usersRes.count || 0;
        const totalScans = scansRes.count || 0;
        const scans = verdictRes.data || [];

        const verdictCounts = scans.reduce((acc, s) => {
            const v = s.overall_verdict || "unknown";
            acc[v] = (acc[v] || 0) + 1;
            return acc;
        }, {});

        const typeCounts = scans.reduce((acc, s) => {
            acc[s.scan_type] = (acc[s.scan_type] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                total_users: totalUsers,
                total_scans: totalScans,
                verdict_distribution: verdictCounts,
                scan_type_distribution: typeCounts,
                recent_scans: scans.slice(0, 10),
            },
        });
    } catch (err) {
        logger.error("Admin stats error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
