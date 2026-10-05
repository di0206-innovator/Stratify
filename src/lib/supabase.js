import { createClient } from '@supabase/supabase-js';

const SUPABASE_FALLBACK_URL = 'https://kekoeliybtqrhgxazfhz.supabase.co';
const SUPABASE_FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla29lbGl5YnRxcmhneGF6Zmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODg3MTcsImV4cCI6MjA5ODY2NDcxN30.q0leW8CEL--5YL2fnbbzoRTX9pVoXibYw-VACDCBsCU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_FALLBACK_ANON_KEY;

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && !!supabaseAnonKey && supabaseAnonKey !== 'placeholder_anon_key';
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'stratify_supabase_auth_token'
      }
    })
  : null;

