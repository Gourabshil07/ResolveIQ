import { createClient } from '@supabase/supabase-js';

// Helper to access Vite environment variables safely via import.meta.env or process.env
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }
  } catch {
    // Ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }
  } catch {
    // Ignore
  }
  return '';
};

export const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
export const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

// Validation check for complete Supabase configuration
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Returns missing environment variable names or clear configuration error if unconfigured
export const getSupabaseConfigError = (): string | null => {
  if (isSupabaseConfigured) return null;

  const missing: string[] = [];
  if (!supabaseUrl || !supabaseUrl.startsWith('http') || supabaseUrl.includes('your-supabase-project')) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.length <= 20 || supabaseAnonKey.includes('your-supabase-anon-key')) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  return `Supabase authentication is not configured. Missing required environment variable(s): ${missing.join(', ')}.`;
};

if (!isSupabaseConfigured) {
  console.warn('[Supabase Config Notice]', getSupabaseConfigError());
}

// Initialize Supabase client instance (uses safe fallback if unconfigured to prevent module import crash)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key-awaiting-environment-variables'
);

