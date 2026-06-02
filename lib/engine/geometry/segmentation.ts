// Segmentation — resolves the canonical segments + junctions (+ spans, mount
// surfaces) for a take-off. Pure, driven by primitive KIND (never system identity):
//   • length segmented  → one segment per input segment, junctions between them
//   • length single     → one segment spanning the whole run
//   • height            → one continuous segment + (flights−1) rest-platform junctions
//   • count             → no segments
// Per-segment chains let per_segment properties evaluate per segment and sum.

import type {
  DimensionChain,
  Junction,
  LengthInput,
  MountSurface,
  Primitive,
  Segment,
  SegmentInput,
  Span,
  SpanDeclaration,
} from '@/lib/types';
import { chainLength } from './dimension-chain';
import { resolveSpans } from './spans';

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

function flatChain(length: number): DimensionChain {
  return {
    steps: [
      { role: 'input', name: 'measured', value: length, source: 'user_input', from: ['segment'] },
      { role: 'adjusted', name: 'effective', value: length, source: 'derived', from: ['measured'] },
      { role: 'constrained', name: 'installed', value: length, source: 'derived', from: ['effective'] },
      { role: 'quantized', name: 'physical', value: length, source: 'derived', from: ['installed'] },
    ],
  };
}

export type GeometryParts = { segments: Segment[]; junctions: Junction[]; spans: Span[]; mount_surfaces: MountSurface[] };

export function buildGeometry(args: {
  primitive: Primitive;
  runChain: DimensionChain;
  derived: Record<string, number>;
  primitiveInput: unknown;
  spanDecls?: SpanDeclaration[];
}): GeometryParts {
  const { primitive, runChain, derived, primitiveInput, spanDecls } = args;
  const segments: Segment[] = [];
  const junctions: Junction[] = [];

  if (primitive.kind === 'length') {
    const li = primitiveInput as LengthInput | undefined;
    if (li && typeof li === 'object' && li.mode === 'segmented' && Array.isArray(li.segments)) {
      const segs = li.segments as SegmentInput[];
      let pos = 0;
      segs.forEach((s, i) => {
        const len = num(s.length) + num(s.offsets?.start) + num(s.offsets?.end);
        segments.push({
          id: `seg-${i}`, index: i, primitive_input: s.length, dimension_chain: flatChain(len),
          foot_kind: i === 0 ? 'free' : 'junction_attached',
          head_kind: i === segs.length - 1 ? 'free' : 'junction_attached',
        });
        pos += len;
        if (i < segs.length - 1) {
          junctions.push({ id: `jct-${i}`, type: s.junction_after?.type ?? 'splice', position: pos, variant: s.junction_after?.variant, attributes: {} });
        }
      });
    } else {
      const len = chainLength(runChain);
      segments.push({ id: 'seg-0', index: 0, primitive_input: len, dimension_chain: runChain, foot_kind: 'free', head_kind: 'free' });
    }
  } else if (primitive.kind === 'height') {
    // one continuous segment (rungs run the whole climb); rest platforms are junctions.
    const len = chainLength(runChain);
    segments.push({ id: 'seg-0', index: 0, primitive_input: len, dimension_chain: runChain, foot_kind: 'free', head_kind: 'free' });
    const flights = Math.max(1, derived.flights ?? 1);
    for (let k = 1; k < flights; k++) {
      junctions.push({ id: `rp-${k}`, type: 'rest_platform', position: Math.round((len * k) / flights), attributes: {} });
    }
  }
  // count → no segments

  const runLen = chainLength(runChain);
  const spans = spanDecls?.length ? resolveSpans(spanDecls, segments, junctions, runLen) : [];
  // v1: a single mount surface spanning the whole run (per_mount_surface == whole run).
  const mount_surfaces: MountSurface[] = segments.length
    ? [{ id: 'ms-0', substrate: 'default', support_grid: { kind: 'regular', spacing: 0, phase: 0 }, segments_covered: segments.map((s) => s.id), span_range: [0, runLen] }]
    : [];

  return { segments, junctions, spans, mount_surfaces };
}
