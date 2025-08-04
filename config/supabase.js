// config/supabase.js
require('dotenv').config(); // This loads your .env variables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and ANON_KEY must be defined in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
