import type { Repository } from './types';
import { createMemoryRepo } from './memory-repo';

let _repo: Repository | null = null;

/**
 * The active repository. Backed by the in-memory seed today; the Supabase
 * implementation (Brief 01 provisioning) drops in here behind the same interface,
 * env-switched, with no changes at call sites.
 */
export function getRepo(): Repository {
  if (!_repo) _repo = createMemoryRepo();
  return _repo;
}

export type { Repository } from './types';
export { seed } from './seed';
