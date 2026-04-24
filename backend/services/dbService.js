const { supabaseAdmin } = require("../config/supabase");

exports.insert = async (table, data) => {
    const { data: result, error } = await supabaseAdmin
        .from(table)
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return result;
};

exports.update = async (table, match, updates) => {
    const { data, error } = await supabaseAdmin
        .from(table)
        .update(updates)
        .match(match)
        .select();
    if (error) throw error;
    return data;
};

exports.find = async (table, match) => {
    const { data, error } = await supabaseAdmin
        .from(table)
        .select("*")
        .match(match);
    if (error) throw error;
    return data;
};
