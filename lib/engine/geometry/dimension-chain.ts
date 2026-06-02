// Generic dimension chain (input → adjusted → constrained → quantized).
// v1: additive geometric modifiers at `adjusted`; `constrained`/`quantized` are
// pass-through (auto-split → Brief 07, pack_stock → Brief 08). `count` has only
// an input step. Behaviour is driven by declared modifier TYPES, never by system id.

import type { ChainRole, DimensionChain, DimensionChainStep, Modifier, Primitive } from '@/lib/types';

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v) || 0;
}

export function buildChain(
  primitive: Primitive,
  rawValue: number,
  modifiers: Modifier[],
  modifierValues: Record<string, unknown>,
): DimensionChain {
  const input: DimensionChainStep = {
    role: 'input',
    name: 'measured',
    value: rawValue,
    source: 'user_input',
    from: [`primitive.${primitive.kind}`],
  };
  // count / area / volume have only an input step (no length adjust→constrain→quantize chain).
  if (primitive.kind === 'count' || primitive.kind === 'area' || primitive.kind === 'volume') return { steps: [input] };

  // adjusted: sum additive geometric distance modifiers (offsets, extensions, overshoot)
  const additive = modifiers.filter(
    (m) => m.enabled && m.group === 'geometric' && m.type.kind === 'distance',
  );
  const addTotal = additive.reduce(
    (s, m) => s + num(modifierValues[m.name] ?? m.default_value),
    0,
  );
  const adjustedVal = rawValue + addTotal;

  const adjusted: DimensionChainStep = {
    role: 'adjusted',
    name: 'effective',
    value: adjustedVal,
    source: 'derived',
    from: ['measured', ...additive.map((m) => m.name)],
  };
  const constrained: DimensionChainStep = {
    role: 'constrained',
    name: 'installed',
    value: adjustedVal,
    source: 'derived',
    from: ['effective'],
  };
  const quantized: DimensionChainStep = {
    role: 'quantized',
    name: 'physical',
    value: adjustedVal,
    source: 'derived',
    from: ['installed'],
  };
  return { steps: [input, adjusted, constrained, quantized] };
}

export function chainValue(chain: DimensionChain, role: ChainRole): number {
  const s = [...chain.steps].reverse().find((x) => x.role === role);
  return (s ?? chain.steps[chain.steps.length - 1]).value;
}

/** The length used for spacing/rate properties — the most-processed available step. */
export function chainLength(chain: DimensionChain): number {
  return chain.steps[chain.steps.length - 1].value;
}
