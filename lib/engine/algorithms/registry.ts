import type { Algorithm, AlgorithmRegistry } from './types';
import { packStock } from './pack-stock';
import { placeSupports } from './place-supports';
import { cutFromStock } from './cut-from-stock';

export function createRegistry(algos: Algorithm[] = []): AlgorithmRegistry {
  const m: AlgorithmRegistry = new Map();
  for (const a of algos) m.set(a.name, a);
  return m;
}

/** The standard solvers (greedy v1; ILP swaps in behind the interface in Brief 10). */
export const standardRegistry: AlgorithmRegistry = createRegistry([packStock, placeSupports, cutFromStock]);

/** Kept for callers that want the default set. */
export const defaultRegistry: AlgorithmRegistry = standardRegistry;
