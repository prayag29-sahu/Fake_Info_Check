const aiService = require("../services/aiService");
const storageService = require("../services/storageService");
const { supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.checkDocument = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        // 1. Create scan_history
        const { data: scan, error: scanError } = await supabaseAdmin
            .from("scan_history")
            .insert({
                user_id: userId,
                scan_type: "document",
                input_summary: file.originalname,
                status: "processing",
            })
            .select()
            .single();

        if (scanError) throw scanError;

        // 2. Upload to Firebase
        let upload = { path: null, url: null };
        try {
            upload = await storageService.uploadFile(file, userId, scan.id, "documents");
        } catch (storageErr) {
            logger.warn("Firebase document upload failed:", storageErr.message);
        }

        // 3. Save media_files
        const { data: media } = await supabaseAdmin
            .from("media_files")
            .insert({
                scan_history_id: scan.id,
                uploaded_by: userId,
                media_type: "document",
                original_filename: file.originalname,
                storage_path: upload.path,
                storage_url: upload.url,
            })
            .select()
            .single();

        // 4. Call AI engine
        let aiResult;
        try {
            aiResult = await aiService.checkDocument(file.buffer, file.originalname, file.mimetype);
        } catch (aiErr) {
            await supabaseAdmin.from("scan_history").update({ status: "failed" }).eq("id", scan.id);
            throw new Error(`AI engine error: ${aiErr.message}`);
        }

        // 5. Save document_checks
        await supabaseAdmin.from("document_checks").insert({
            scan_history_id: scan.id,
            media_file_id: media?.id || null,
            final_label: aiResult.label,
            confidence_score: aiResult.confidence,
            extractions: aiResult.extracted_data || {},
        });

        // 6. Save scan_results
        await supabaseAdmin.from("scan_results").insert({
            scan_history_id: scan.id,
            raw_ai_response: aiResult,
            verdict: aiResult.label,
            confidence: aiResult.confidence,
        });

        // 7. Update scan_history
        await supabaseAdmin
            .from("scan_history")
            .update({
                overall_verdict: aiResult.label,
                confidence: aiResult.confidence,
                status: "completed",
            })
            .eq("id", scan.id);

        logger.info(`Document scan completed for user ${userId}: ${aiResult.label}`);

        res.json({
            success: true,
            data: aiResult,
            scan_id: scan.id,
            file_url: upload.url,
        });
    } catch (err) {
        logger.error("Document check error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
