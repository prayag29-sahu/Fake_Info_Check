const { supabase, supabaseAdmin } = require("../config/supabase");
const { logger } = require("../utils/logger");

exports.signup = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name } },
        });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        // Upsert profile row
        if (data.user) {
            await supabaseAdmin.from("profiles").upsert({
                id: data.user.id,
                email,
                full_name,
                role: "user",
            });
        }

        res.status(201).json({
            success: true,
            message: "Account created. Check your email to confirm.",
            user: { id: data.user?.id, email },
        });
    } catch (err) {
        logger.error("Signup error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return res.status(401).json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            session: {
                access_token: data.session.access_token,
                expires_at: data.session.expires_at,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name,
                },
            },
        });
    } catch (err) {
        logger.error("Login error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", req.user.id)
            .single();

        if (error) {
            return res.status(404).json({ success: false, error: "Profile not found" });
        }

        res.json({ success: true, data: profile });
    } catch (err) {
        logger.error("Get profile error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        await supabase.auth.signOut();
        res.json({ success: true, message: "Logged out" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
