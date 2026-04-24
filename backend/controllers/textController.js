const aiService = require("../services/aiService");
const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.checkText = async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user.id;

        // 1. Create scan_history record
        const { data: scan, error: scanError } = await supabaseAdmin
            .from("scan_history")
            .insert({
                user_id: userId,
                scan_type: "text",
                input_summary: text.slice(0, 150),
                status: "processing",
            })
            .select()
            .single();

        if (scanError) throw scanError;

        // 2. Call AI engine
        let aiResult;
        try {
            aiResult = await aiService.checkText(text);
        } catch (aiErr) {
            await supabaseAdmin
                .from("scan_history")
                .update({ status: "failed" })
                .eq("id", scan.id);
            throw new Error(`AI engine error: ${aiErr.message}`);
        }

        // 3. Save scan_results
        await supabaseAdmin.from("scan_results").insert({
            scan_history_id: scan.id,
            raw_ai_response: aiResult,
            verdict: aiResult.label,
            confidence: aiResult.confidence,
            indicators: aiResult.indicators || [],
        });

        // 4. Save text_checks
        await supabaseAdmin.from("text_checks").insert({
            scan_history_id: scan.id,
            input_text: text,
            final_label: aiResult.label,
            confidence_score: aiResult.confidence,
            indicators: aiResult.indicators || [],
        }).select();

        // 5. Update scan_history to completed
        await supabaseAdmin
            .from("scan_history")
            .update({
                overall_verdict: aiResult.label,
                confidence: aiResult.confidence,
                status: "completed",
            })
            .eq("id", scan.id);

        logger.info(`Text scan completed for user ${userId}: ${aiResult.label}`);

        res.json({
            success: true,
            data: aiResult,
            scan_id: scan.id,
        });
    } catch (err) {
        logger.error("Text check error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
