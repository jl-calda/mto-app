import type { Algorithm, AlgorithmRegistry } from './types';

export function createRegistry(algos: Algorithm[] = []): AlgorithmRegistry {
  const m: AlgorithmRegistry = new Map();
  for (const a of algos) m.set(a.name, a);
  return m;
}

/** Default registry — concrete algorithms are registered in Brief 08. */
export const defaultRegistry: AlgorithmRegistry = createRegistry([]);
