import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://lbldljgyusyqqcbyvmem.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseAnonKey) {
  console.warn('[MAXLINE Supabase] VITE_SUPABASE_ANON_KEY is not configured. Please provide your MAXLINE Supabase publishable anon key in apps/dashboard/.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'unconfigured-maxline-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
