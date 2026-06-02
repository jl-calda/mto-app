// Span resolution — turns declarative SpanDeclarations into concrete ranges over
// the resolved segments/junctions. Pure. Endpoints are resolved to positions along
// the run; a span covers the segments/junctions whose extent overlaps its range.

import type { Junction, Segment, Span, SpanDeclaration, SpanEndpoint } from '@/lib/types';
import { chainLength } from './dimension-chain';

function segStart(segments: Segment[], index: number): number {
  let p = 0;
  for (let i = 0; i < index && i < segments.length; i++) p += chainLength(segments[i].dimension_chain);
  return p;
}
function segLen(segments: Segment[], index: number): number {
  const s = segments[index];
  return s ? chainLength(s.dimension_chain) : 0;
}

function endpointPos(ep: SpanEndpoint, segments: Segment[], junctions: Junction[], runLength: number): number {
  switch (ep.kind) {
    case 'segment_foot': return segStart(segments, ep.segment_index) + (ep.offset ?? 0);
    case 'segment_head': return segStart(segments, ep.segment_index) + segLen(segments, ep.segment_index) + (ep.offset ?? 0);
    case 'junction_deck': return (junctions[ep.junction_index]?.position ?? 0) + (ep.offset ?? 0);
    case 'compliance_constant': return 0; // a real constants table lands later; 0 = run foot
  }
}

export function resolveSpans(decls: SpanDeclaration[], segments: Segment[], junctions: Junction[], runLength: number): Span[] {
  return decls
    .filter((d) => d.enabled)
    .map((d) => {
      const a = endpointPos(d.start, segments, junctions, runLength);
      const b = endpointPos(d.end, segments, junctions, runLength);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      const covered_segments = segments.filter((s) => {
        const ss = segStart(segments, s.index);
        return ss + segLen(segments, s.index) > lo && ss < hi;
      }).map((s) => s.id);
      const covered_junctions = junctions.filter((j) => j.position >= lo && j.position <= hi).map((j) => j.id);
      return { name: d.name, range: [lo, hi] as [number, number], covered_segments, covered_junctions, length: hi - lo };
    });
}
