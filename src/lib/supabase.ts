import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get environment variables - Vite exposes these via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined');

if (!isConfigured) {
  console.error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel environment.');
}

// Create client with actual values or safe fallbacks
export const supabase = createClient<Database>(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export const isSupabaseConfigured = isConfigured;
