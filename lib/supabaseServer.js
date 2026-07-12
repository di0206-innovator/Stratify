/**
 * lib/supabaseServer.js
 * Server-side Supabase client using the service role key.
 * Works on Vercel (serverless) since it uses HTTP, not persistent connections.
 */
const { createClient } = require('@supabase/supabase-js');

let _supabase = null;

function getSupabaseAdmin() {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }
  if (_supabase) return _supabase;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url === 'https://placeholder.supabase.co') {
    return null;
  }
  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _supabase;
}

module.exports = { getSupabaseAdmin };
