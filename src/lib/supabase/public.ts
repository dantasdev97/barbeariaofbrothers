import "server-only";
import { createClient as createSbClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Anonymous Supabase client (no auth, no cookies). Safe to use inside `'use cache'`
 * — Cache Components forbids `cookies()` calls in cached scopes.
 *
 * Reads are restricted by RLS to active rows only.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSbClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
}
