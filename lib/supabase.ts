import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once the project is connected to Supabase. Until then the site runs on seed content. */
export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

/**
 * Browser/server client using the public anon key. All access is governed by
 * Row Level Security (see supabase/schema.sql) — the service-role key is never
 * used here and must never be shipped to the browser.
 */
export function supabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url!, anon!, { auth: { persistSession: true } });
  return client;
}
