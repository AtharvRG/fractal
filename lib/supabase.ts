import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (client) return client;
  // Accept either public-prefixed env vars or server-side ones
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Missing Supabase env vars (SUPABASE_URL / SUPABASE_ANON_KEY or NEXT_PUBLIC_ variants)');
  client = createClient(url, anon, { auth: { persistSession: false } });
  return client;
}
