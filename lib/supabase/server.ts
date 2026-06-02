import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null | undefined;

/**
 * Server-side service-role client (bypasses RLS — never import from client code).
 * Returns null when env is unset, in which case the app falls back to the
 * in-memory repository. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to activate.
 */
export function getServiceClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return _client;
}
