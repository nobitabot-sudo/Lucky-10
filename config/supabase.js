require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Test connection immediately
supabase.from('users').select('*').limit(1)
  .then(() => console.log('✅ Supabase connection verified'))
  .catch(err => {
    console.error('❌ Supabase connection failed:', err.message);
    process.exit(1);
  });

module.exports = supabase;
