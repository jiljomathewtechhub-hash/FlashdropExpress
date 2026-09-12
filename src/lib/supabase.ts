import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Live Supabase project credentials for FlashDrop Express
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://tummlwngzqgkksuytftf.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bW1sd25nenFna2tzdXl0ZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDA1NTYsImV4cCI6MjEwNDM3NjU1Nn0.RJvHr-WgCdfZNL5B7UeDGFrRSEEyHCqd263FDOfZRIE';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project') &&
    SUPABASE_URL.startsWith('https://')
);

// Primary shared client (persists active session in localStorage)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Secondary client for administrative provisioning (does NOT overwrite logged-in admin session)
export const createUnpersistedClient = (): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

