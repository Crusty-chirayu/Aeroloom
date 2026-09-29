import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase client.
 * Returns null if Supabase environment variables are not configured,
 * allowing Aeroloom to run in full device-local offline mode.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(url, anonKey);
  }

  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
