// models/userModel.js
const { supabase } = require("../config/db");

async function getUserByEmail(email) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
    if (error) return null;
    return data;
}

async function createUser(userData) {
    const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();
    if (error) throw error;
    return data;
}

module.exports = { getUserByEmail, createUser };
