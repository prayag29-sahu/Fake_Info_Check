const aiService = require("../services/aiService");
const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.checkURL = async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.user.id;

        // 1. Create scan_history
        const { data: scan, error: scanError } = await supabaseAdmin
            .from("scan_history")
            .insert({
                user_id: userId,
                scan_type: "url",
                input_summary: url.slice(0, 200),
                status: "processing",
            })
            .select()
            .single();

        if (scanError) throw scanError;

        // 2. Call AI engine
        let aiResult;
        try {
            aiResult = await aiService.checkURL(url);
        } catch (aiErr) {
            await supabaseAdmin.from("scan_history").update({ status: "failed" }).eq("id", scan.id);
            throw new Error(`AI engine error: ${aiErr.message}`);
        }

        // 3. Save url_checks
        await supabaseAdmin.from("url_checks").insert({
            scan_history_id: scan.id,
            url_input: url,
            final_label: aiResult.label,
            confidence_score: aiResult.confidence,
            threat_type: aiResult.threat_type || null,
            indicators: aiResult.indicators || [],
        });

        // 4. Save scan_results
        await supabaseAdmin.from("scan_results").insert({
            scan_history_id: scan.id,
            raw_ai_response: aiResult,
            verdict: aiResult.label,
            confidence: aiResult.confidence,
        });

        // 5. Update scan_history
        await supabaseAdmin
            .from("scan_history")
            .update({
                overall_verdict: aiResult.label,
                confidence: aiResult.confidence,
                status: "completed",
            })
            .eq("id", scan.id);

        logger.info(`URL scan completed for user ${userId}: ${aiResult.label} — ${url}`);

        res.json({
            success: true,
            data: aiResult,
            scan_id: scan.id,
        });
    } catch (err) {
        logger.error("URL check error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
