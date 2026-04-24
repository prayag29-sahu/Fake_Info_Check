const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
}

// Public client (respects RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (bypasses RLS — use only in controllers)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
});

module.exports = { supabase, supabaseAdmin };
