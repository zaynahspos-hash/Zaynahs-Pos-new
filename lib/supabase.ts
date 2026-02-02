import { createClient } from '@supabase/supabase-js';

// robustly get the environment object
const getEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
};

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Supabase URL is missing. Using placeholder. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to handle Supabase errors uniformly
export const handleSupabaseError = (error: any) => {
  if (error) {
    console.error('Supabase Error:', error.message);
    // Don't throw, just log, to prevent app crash on UI
    // throw new Error(error.message); 
  }
};