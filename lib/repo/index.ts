import type { Repository } from './types';
import { createMemoryRepo } from './memory-repo';
import { createSupabaseRepo } from './supabase-repo';
import { getServiceClient } from '@/lib/supabase/server';

let _repo: Repository | null = null;

/**
 * The active repository. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * are set (then run POST /api/seed once); otherwise the in-memory seed — both
 * behind the same interface, with no changes at call sites.
 */
export function getRepo(): Repository {
  if (_repo) return _repo;
  const db = getServiceClient();
  _repo = db ? createSupabaseRepo(db) : createMemoryRepo();
  return _repo;
}

export type { Repository } from './types';
export { seed } from './seed';
