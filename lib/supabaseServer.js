/**
 * lib/supabaseServer.js
 * Server-side Supabase client using the service role key.
 * Works on Vercel (serverless) since it uses HTTP, not persistent connections.
 */
const { createClient } = require('@supabase/supabase-js');

let _supabase = null;

const SUPABASE_FALLBACK_URL = 'https://kekoeliybtqrhgxazfhz.supabase.co';
const SUPABASE_FALLBACK_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla29lbGl5YnRxcmhneGF6Zmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODcxNywiZXhwIjoyMDk4NjY0NzE3fQ.6b_tauplpstYLp64jQ3XWpTrY31QsQK8ka_2DVcPkv0';

function getSupabaseAdmin() {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }
  if (_supabase) return _supabase;
  const url = process.env.VITE_SUPABASE_URL || SUPABASE_FALLBACK_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_FALLBACK_SERVICE_KEY;
  if (!url || !key || url === 'https://placeholder.supabase.co') {
    return null;
  }
  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _supabase;
}

module.exports = { getSupabaseAdmin };
