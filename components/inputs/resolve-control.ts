// Pure resolver: maps a field's data TYPE (+ context) to a normalized control
// descriptor. No React, no engine imports — so it's trivially testable and the
// single source of truth for "type the value vs pick from a set vs bounded number".

import type { InputType, ModifierType } from '@/lib/types';
import type { Band } from '@/lib/engine/bands';

export type Option = { value: string; label: string };

export type ControlDescriptor =
  | { control: 'select'; options: Option[]; tag: 'list' }
  | { control: 'chips'; options: Option[]; tag: 'list' }
  | { control: 'tokens'; tag: 'free list' }
  | { control: 'number'; unit?: string; min?: number; max?: number; step?: number; tag: string }
  | { control: 'band'; unit: string; bands: Band[]; tag: 'bands' }
  | { control: 'toggle'; tag: 'toggle' }
  | { control: 'text'; suggestions?: string[]; tag: 'free text' }
  | { control: 'advanced'; reason: string; tag: 'advanced' };

export type ResolveCtx = {
  /** Known set of allowed values (derived criteria, etc.). Non-empty → pick/chips. */
  options?: string[];
  /** Render an enum-like as multi-select chips instead of a single select. */
  multi?: boolean;
  /** Datalist hints for an otherwise-free text field. */
  suggestions?: string[];
};

const opts = (vs: string[]): Option[] => vs.map((v) => ({ value: v, label: v }));

function assertNever(x: never): never {
  throw new Error(`resolveControl: unhandled kind ${JSON.stringify(x)}`);
}

/** Pick-list when values exist (chips if multi), else free text — never an empty dropdown. */
function pickFor(values: string[], ctx: ResolveCtx): ControlDescriptor {
  if (!values.length) return { control: 'text', suggestions: ctx.suggestions, tag: 'free text' };
  return ctx.multi
    ? { control: 'chips', options: opts(values), tag: 'list' }
    : { control: 'select', options: opts(values), tag: 'list' };
}

export function resolveInputType(t: InputType, ctx: ResolveCtx = {}): ControlDescriptor {
  switch (t.kind) {
    case 'distance': return { control: 'number', unit: 'mm', min: 0, step: 1, tag: 'mm' };
    case 'number': return { control: 'number', min: 0, tag: 'number' };
    case 'integer': return { control: 'number', min: 0, step: 1, tag: 'integer' };
    case 'bool': return { control: 'toggle', tag: 'toggle' };
    case 'enum': return pickFor(t.values, ctx);
    case 'variant': return { control: 'select', options: t.options.map((o) => ({ value: o.value, label: o.label })), tag: 'list' };
    default: return assertNever(t);
  }
}

export function resolveModifierType(t: ModifierType, ctx: ResolveCtx = {}): ControlDescriptor {
  switch (t.kind) {
    case 'distance': return { control: 'number', unit: 'mm', min: 0, step: 1, tag: 'mm' };
    case 'percentage': return { control: 'number', unit: '%', min: 0, max: 100, step: 1, tag: '0–100%' };
    case 'bool': return { control: 'toggle', tag: 'toggle' };
    case 'enum': return pickFor(t.values, ctx);
    case 'enum_with_attributes': return pickFor(t.values.map((v) => v.name), ctx);
    case 'banded_distance': return { control: 'band', unit: 'mm', bands: t.bands, tag: 'bands' };
    case 'discrete_set': return { control: 'advanced', reason: `set of ${t.element_type.kind}`, tag: 'advanced' };
    case 'support_grid': return { control: 'advanced', reason: 'support grid', tag: 'advanced' };
    default: return assertNever(t);
  }
}

/** Criteria carry no inline options — pick if a known set was derived, else free text. */
export function resolveCriterion(ctx: ResolveCtx = {}): ControlDescriptor {
  if (ctx.options && ctx.options.length) return pickFor(ctx.options, ctx);
  return { control: 'text', suggestions: ctx.suggestions, tag: 'free text' };
}
