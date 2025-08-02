const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 📌 Get user by email
async function getUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error("getUserByEmail Error:", error);
        return null;
    }
    return data;
}

// 📌 Create new user
async function createUser(user) {
    const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();

    if (error) {
        console.error("createUser Error:", error);
        return null;
    }
    return data;
}

module.exports = {
    getUserByEmail,
    createUser
};
