'use client';
// Take-off · Plant access ladder · MTO
// Ported 1:1 from the design bundle's takeoff-ladder.html.
// Left pane mirrors the system structure (variant · criteria · primitive/chain ·
// properties · attachment); right pane is the sticky live MTO.

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Shell, Stat, PrimitiveBadge, Icon } from '@/components/chrome';
import { Visual } from '@/components/visual';
import type { MtoLine, Visual as VisualT } from '@/lib/types';

const mto: MtoLine[] = [
  { sku: 'VEC-LDR-S-3000-AN', name: 'Ladder stile · 3000 mm · anodized', qty: 8, unit: 'ea', rule: 'stiles', formula: 'pack_stock(9700, [3000]).pieces × 2 stiles' },
  { sku: 'VEC-LDR-RUNG-AN', name: 'Rung · anodized', qty: 33, unit: 'ea', rule: 'rungs', formula: 'ceil(9450 / 280) + 1' },
  { sku: 'VEC-LDR-CAGE-AN', name: 'Cage hoop · anodized', qty: 24, unit: 'ea', rule: 'cage_hoops', formula: 'ceil((H-3000)/280) (above 3 m threshold)' },
  { sku: 'VEC-LDR-STR-AN', name: 'Cage stringer · anodized', qty: 4, unit: 'ea', rule: 'cage_stringers', formula: 'rate: 4 per flight' },
  { sku: 'VEC-LDR-RP-AN', name: 'Rest platform', qty: 1, unit: 'ea', rule: 'rest_platforms', formula: 'junctions = 1 (auto-split flights)' },
  { sku: 'VEC-BRK-S', name: 'Wall bracket · standard', qty: 6, unit: 'ea', rule: 'mounting_brackets', formula: 'ceil(H / 1600)' },
  { sku: 'VEC-CERT-NF', name: 'Compliance certificate · NF E85-016', qty: 1, unit: 'ea', rule: 'compliance_cert', formula: '1' },
];

// materials contributed by the attached Top-walkway system (WG-Coastal model)
const walkwayMto: MtoLine[] = [
  { sku: 'VEC-WLK-GR-6000', name: 'Walkway grating · 6000 mm', qty: 2, unit: 'ea', rule: 'deck_packing', formula: 'pack_stock(12000, [6000])' },
  { sku: 'VEC-UPR-FS-AN', name: 'Guardrail upright · floor fix', qty: 9, unit: 'ea', rule: 'intermediate', formula: 'ceil(12000 / 1500) + 1' },
  { sku: 'VEC-RAIL-T-3000-AN', name: 'Top rail · 3000 mm · anodized', qty: 5, unit: 'ea', rule: 'rail_top', formula: 'pack_stock(12000, [3000])' },
  { sku: 'VEC-LDR-GATE-SC', name: 'Self-closing gate · ladder exit', qty: 1, unit: 'ea', rule: 'connection', formula: '1 at join (front exit)' },
  { sku: 'VEC-TRN-BRK-AN', name: 'Transition bracket · ladder→walkway', qty: 2, unit: 'ea', rule: 'connection', formula: '2 at connection' },
];

// map a SKU/name to a built-in icon for the MTO line visual
function skuVisual(sku: string): VisualT {
  const s = sku.toUpperCase();
  if (s.includes('RUNG')) return { kind: 'icon', name: 'ladder' };
  if (s.includes('LDR-S') || s.includes('STR')) return { kind: 'icon', name: 'post' };
  if (s.includes('CAGE')) return { kind: 'icon', name: 'cage' };
  if (s.includes('RP-') || s.includes('WLK-GR')) return { kind: 'icon', name: 'grid' };
  if (s.includes('BRK') || s.includes('TRN')) return { kind: 'icon', name: 'bracket' };
  if (s.includes('RAIL')) return { kind: 'icon', name: 'rail' };
  if (s.includes('UPR')) return { kind: 'icon', name: 'post' };
  if (s.includes('GATE')) return { kind: 'icon', name: 'flag' };
  if (s.includes('CERT')) return { kind: 'icon', name: 'file' };
  return { kind: 'icon', name: 'box' };
}

export default function TakeoffLadderPage() {
  const [showDerived, setShowDerived] = useState(true);
  const [inclWalkway, setInclWalkway] = useState(true);
  const H = 9200; // platform to platform
  const handhold = 250;
  const overshoot = 0;
  const effective = H + handhold + overshoot; // 9450
  const flight_max = 6000;
  const flights = Math.ceil(effective / flight_max); // 2 flights
  const constrained = effective + (flights - 1) * 250; // include rest platform allowance
  const quantized = Math.ceil(constrained / 3000) * 3000; // 12000
  const lines = inclWalkway ? mto.concat(walkwayMto) : mto;

  return (
    <Shell
      crumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Westfield Sky Garden L08', href: '/projects/westfield-sky-garden-l08' },
        { label: 'Plant access ladder · L1→L4' },
      ]}
      navActive="projects"
      topRight={
        <>
          <span className="mono" style={{ fontSize: 11, color: 'var(--warn)' }}>● review</span>
          <button className="btn sm">Duplicate</button>
          <button className="btn sm primary">Export</button>
        </>
      }
    >
      <div style={st.outer}>
        <div style={st.head}>
          <div>
            <h1 style={st.title}>Plant access ladder · L1→L4</h1>
            <div style={st.subRow}>
              <PrimitiveBadge kind="height" />
              <span className="tag">sys · Vertical access ladder</span>
              <span className="tag">mod · NF E85-016 cage ladder</span>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              <span className="mono" style={{ fontSize: 11 }}>Westfield Sky Garden — L08</span>
            </div>
          </div>
          <div style={st.headStats}>
            <Stat k="lines" v={lines.length} />
            <Stat k="items" v={lines.reduce((s, l) => s + l.qty, 0)} />
            <Stat k="warnings" v={1} highlight="warn" />
          </div>
        </div>

        <div style={st.body}>
          <div style={st.left}>
            {/* variant */}
            <Section index="01" title="System variant">
              <div style={st.varGrid}>
                {['Standard', 'Cage ladder', 'Side-exit cage'].map((v) => (
                  <div key={v} style={{ ...st.varTile, ...(v === 'Cage ladder' ? st.varTileSel : null) }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                      {v === 'Standard' ? 'has_cage: false' : v === 'Cage ladder' ? 'has_cage: true' : 'has_cage: true · side_exit: true'}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section index="02" title="Criteria">
              <div style={st.kvGrid}>
                <KV k="material_finish" v="anodized" />
                <KV k="compliance_code" v="NF E85-016" />
                <KV k="load_class" v="1" />
              </div>
            </Section>

            <Section index="03" title="Primitive · height">
              <div style={st.kvGrid}>
                <KV k="platform_to_platform" v={`${H.toLocaleString()} mm`} source="user_input" />
                <KV k="handhold_extension" v={`${handhold} mm`} source="code_default" />
                <KV k="overshoot" v={`${overshoot} mm`} />
                <KV k="flight_max_height" v={`${flight_max.toLocaleString()} mm`} source="code_default" />
                <KV k="wall_offset" v="200 mm" />
                <KV k="rung_stock_options" v="[3000]" />
              </div>

              <div style={st.chainWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="uc">dimension chain</div>
                  <button className="btn ghost sm" onClick={() => setShowDerived(!showDerived)}>
                    {showDerived ? 'Hide derivations' : 'Show derivations'}
                  </button>
                </div>
                <div style={st.chain}>
                  <ChainStep role="input" name="climbing_height" value={H} expanded={showDerived}
                    formula="primitive.height (user_input)" />
                  <Arrow />
                  <ChainStep role="adjusted" name="effective_climb" value={effective} expanded={showDerived}
                    formula="height + handhold_extension + overshoot"
                    from={['climbing_height', 'handhold_extension', 'overshoot']} />
                  <Arrow />
                  <ChainStep role="constrained" name="installed_climb" value={constrained} expanded={showDerived}
                    formula="auto_split_flights(effective, max=6000) · rest_platform=250"
                    constraints={[
                      { name: 'effective_climb', value: effective, dominant: false },
                      { name: 'flight_split_min', value: constrained, dominant: true },
                    ]} />
                  <Arrow />
                  <ChainStep role="quantized" name="stile_run" value={quantized} expanded={showDerived}
                    formula="pack_stock(installed_climb, [3000])"
                    extra={{ flights: flights, joints: flights - 1, wastage: quantized - constrained }} />
                </div>
              </div>
            </Section>

            <Section index="04" title="Properties">
              <PropRow name="rungs" archetype="spacing-based" qty={33} formula="ceil(effective_climb / 280) + 1">
                <KV k="spacing" v="280 mm" source="code_default" />
              </PropRow>
              <PropRow name="cage_hoops" archetype="threshold-triggered"
                qty={24} formula="ceil((H - 3000)/280) above threshold"
                gated="active · variant has_cage: true & H ≥ 3000mm">
                <KV k="threshold" v="3000 mm" source="code_default" />
                <KV k="hoop_spacing" v="280 mm" source="code_default" />
              </PropRow>
              <PropRow name="stiles" archetype="algorithm-driven · pack_stock"
                qty={8} formula="pack_stock × 2 (left+right stile)">
                <KV k="algorithm" v="pack_stock" />
                <KV k="stock_options" v="[3000]" />
                <div style={st.algoOut}>
                  <div className="uc">algorithm output</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span className="mono"><span style={{ color: 'var(--ink-3)' }}>flights:</span> <b>{flights}</b></span>
                    <span className="mono"><span style={{ color: 'var(--ink-3)' }}>joints:</span> <b>{flights - 1}</b></span>
                    <span className="mono"><span style={{ color: 'var(--ink-3)' }}>cover:</span> <b>{quantized.toLocaleString()} mm</b></span>
                    <span className="mono"><span style={{ color: 'var(--ink-3)' }}>wastage:</span> <b style={{ color: quantized - constrained > 1000 ? 'var(--annotation)' : 'var(--ink)' }}>{quantized - constrained} mm</b></span>
                  </div>
                </div>
              </PropRow>
              <PropRow name="rest_platforms" archetype="junction-scope"
                qty={1} formula="auto_split_flights = 1"
                gated="auto · climbing_height ≥ flight_max">
                <KV k="trigger" v="height ≥ 6000 mm" />
              </PropRow>
              <PropRow name="cage_stringers" archetype="rate-based" qty={4} formula="rate × flights = 4 × 1">
                <KV k="rate" v="4 per cage flight" />
              </PropRow>
              <PropRow name="mounting_brackets" archetype="count-based" qty={6}
                formula="ceil(installed_climb / 1600) = 6">
                <KV k="bracket_spacing" v="1600 mm" />
              </PropRow>
            </Section>

            <div style={{ marginTop: 12, padding: 12, background: 'var(--warn-soft)', border: '1px solid #E8C97A', borderRadius: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Icon.Warn style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Auto-split engaged: climbing height exceeds flight_max</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4 }}>
                    9450 mm / 6000 mm → 2 flights with 1 rest platform
                  </div>
                </div>
              </div>
            </div>

            <AttachmentSection included={inclWalkway} setIncluded={setInclWalkway} deckHeight={effective} />

            <div style={{ height: 80 }} />
          </div>

          {/* MTO */}
          <div style={st.right}>
            <div style={st.mto}>
              <div style={st.mtoHead}>
                <div>
                  <h2 style={st.mtoTitle}>Live MTO</h2>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>NF E85-016 cage ladder</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn sm">CSV</button>
                  <button className="btn sm">PDF</button>
                </div>
              </div>
              <div style={st.mtoSummary}>
                <SummaryStat label="Lines" value={lines.length} />
                <SummaryStat label="Items" value={lines.reduce((s, l) => s + l.qty, 0)} />
                <SummaryStat label="Flights" value={flights} />
                <SummaryStat label="Rest pts" value={1} />
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {mto.map((l, i) => (
                  <div key={i} style={st.mtoRow}>
                    <Visual visual={skuVisual(l.sku)} name={l.name} size={22} rounded={3} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={st.mtoName}>{l.name}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{l.sku}</div>
                    </div>
                    <div style={{ width: 50, textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{l.qty}</span>
                    </div>
                    <div style={{ width: 30, color: 'var(--ink-3)' }} className="mono">
                      <span style={{ fontSize: 11 }}>{l.unit}</span>
                    </div>
                  </div>
                ))}
                {inclWalkway && (
                  <>
                    <div style={st.mtoGroupHead}>
                      <Icon.Dot style={{ color: 'var(--prim-length)' }} />
                      <span>from attachment · Top walkway</span>
                      <span style={{ flex: 1 }} />
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>WG-Coastal</span>
                    </div>
                    {walkwayMto.map((l, i) => (
                      <div key={i} style={{ ...st.mtoRow, background: '#F7F4FB' }}>
                        <Visual visual={skuVisual(l.sku)} name={l.name} size={22} rounded={3} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={st.mtoName}>{l.name}</div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{l.sku}</div>
                        </div>
                        <div style={{ width: 50, textAlign: 'right' }}>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{l.qty}</span>
                        </div>
                        <div style={{ width: 30, color: 'var(--ink-3)' }} className="mono">
                          <span style={{ fontSize: 11 }}>{l.unit}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section style={st.section}>
      <header style={st.sectionHead}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{index}</span>
        <h3 style={st.sectionTitle}>{title}</h3>
      </header>
      <div style={{ padding: '14px 16px 16px' }}>{children}</div>
    </section>
  );
}

function KV({ k, v, source }: { k: string; v: ReactNode; source?: string }) {
  return (
    <div style={st.kv}>
      <div style={st.kvK}>
        <span className="uc">{k}</span>
        {source && <span style={st.kvSource} className="mono">← {source}</span>}
      </div>
      <div className="mono" style={{ fontSize: 12 }}>{v}</div>
    </div>
  );
}

type ChainRole = 'input' | 'adjusted' | 'constrained' | 'quantized';

function ChainStep({
  role, name, value, expanded, formula, from, constraints, extra,
}: {
  role: ChainRole;
  name: string;
  value: number;
  expanded: boolean;
  formula?: string;
  from?: string[];
  constraints?: { name: string; value: number; dominant: boolean }[];
  extra?: Record<string, number | string>;
}) {
  const colors: Record<ChainRole, string> = {
    input: '#F5F2EA', adjusted: '#EDF1F8', constrained: '#F8EFE6', quantized: '#EAF0EA',
  };
  const accents: Record<ChainRole, string> = {
    input: 'var(--ink-3)', adjusted: 'var(--accent)', constrained: 'var(--annotation)', quantized: 'var(--ok)',
  };
  return (
    <div style={{ ...st.chainStep, background: colors[role] }}>
      <div className="uc" style={{ fontSize: 9, color: accents[role], fontWeight: 600 }}>{role}</div>
      <div style={{ fontSize: 18, marginTop: 4 }} className="mono">{value.toLocaleString()}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{name}</div>
      {expanded && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--line-2)' }}>
          {formula && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)' }}>{formula}</div>}
          {from && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
              {from.map((f) => <span key={f} className="tag" style={{ fontSize: 9 }}>{f}</span>)}
            </div>
          )}
          {constraints && (
            <div style={{ marginTop: 6 }}>
              {constraints.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '1px 0' }}>
                  <span className="mono" style={{ color: c.dominant ? 'var(--annotation)' : 'var(--ink-3)' }}>{c.dominant ? '▸' : ' '} {c.name}</span>
                  <span className="mono" style={{ color: c.dominant ? 'var(--ink)' : 'var(--ink-3)' }}>{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {extra && (
            <div style={{ marginTop: 4 }}>
              {Object.entries(extra).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '1px 0' }}>
                  <span className="mono" style={{ color: 'var(--ink-3)' }}>{k}</span>
                  <span className="mono">{typeof v === 'number' ? v.toLocaleString() : v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return <span style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-4)' }}><Icon.Chev /></span>;
}

function PropRow({
  name, archetype, qty, formula, gated, children,
}: {
  name: string;
  archetype: string;
  qty: number;
  formula: string;
  gated?: string;
  children?: ReactNode;
}) {
  return (
    <div style={st.propRow}>
      <div style={st.propHead}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
            <span style={st.archTag}>{archetype}</span>
            {gated && <span style={st.gatedTag} className="mono">{gated}</span>}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{formula}</div>
        </div>
        <div style={st.propQty}>
          <div className="uc" style={{ fontSize: 9, color: 'var(--ink-3)' }}>qty</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--annotation)' }}>{qty}</div>
        </div>
      </div>
      <div style={st.propBody}>{children}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', borderRight: '1px solid var(--line)' }}>
      <div className="uc" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ===== Attachment section — an attached system, inline within the take-off =====
function AttachmentSection({
  included, setIncluded, deckHeight,
}: {
  included: boolean;
  setIncluded: (v: boolean) => void;
  deckHeight: number;
}) {
  return (
    <section style={{ ...st.section, borderColor: included ? 'var(--prim-length)' : 'var(--line)' }}>
      <header style={{ ...st.sectionHead, flexWrap: 'wrap', background: included ? '#EFF3FA' : 'var(--panel-2)' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>05</span>
        <Visual visual={{ kind: 'icon', name: 'rail' }} name="Top walkway" size={22} rounded={3} />
        <h3 style={st.sectionTitle}>Attachment · Top walkway</h3>
        <span style={at.declTag} className="mono">declared on system</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => setIncluded(!included)} style={at.includeBtn}>
          <div style={{
            ...at.check, background: included ? 'var(--accent)' : 'transparent',
            borderColor: included ? 'var(--accent)' : 'var(--line-2)',
          }}>{included && <Icon.Check />}</div>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Include top walkway</span>
        </button>
      </header>

      {included ? (
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={at.modelRow}>
            <span className="uc">model</span>
            <select className="input text" defaultValue="wgc" style={{ fontSize: 12, width: 200 }}>
              <option value="wgc">WG-Coastal</option>
              <option value="wgs">WG-Standard</option>
              <option value="wgg">WG-Galvanised</option>
            </select>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>chosen at take-off</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 10, color: 'var(--prim-length)' }}>+{walkwayMto.length} lines</span>
          </div>

          {/* DERIVED — locked, info only */}
          <Bucket label="Derived" sub="locked · resolved from this ladder" tone="derived">
            <FieldRow name="deck_height" value={`${deckHeight.toLocaleString()} mm`}
              badge={<span style={at.fromTag} className="mono"><Icon.Info /> from ladder.installed_head</span>} />
          </Bucket>

          {/* PRESET — locked + editable */}
          <Bucket label="Preset" sub="pre-filled by the system author" tone="preset">
            <FieldRow name="width" value="800 mm" badge={<span style={at.lockTag} className="mono">🔒 locked</span>} />
            <div style={at.field}>
              <span className="mono" style={{ fontSize: 12, width: 120 }}>variant</span>
              <select className="input text" defaultValue="dr" style={{ fontSize: 12, width: 160 }}>
                <option value="dr">double-rail</option>
                <option value="sr">single-rail</option>
                <option value="mesh">mesh infill</option>
              </select>
              <span style={at.editTag} className="mono">pre-filled · editable</span>
            </div>
          </Bucket>

          {/* OPEN — estimator fills */}
          <Bucket label="Open" sub="you fill these in" tone="open">
            <div style={at.field}>
              <span className="mono" style={{ fontSize: 12, width: 120 }}>length</span>
              <input className="input" defaultValue="12000" style={{ width: 100, fontFamily: 'var(--font-mono)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>mm</span>
            </div>
          </Bucket>

          <div style={at.suppressNote}>
            <Icon.Info style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <span>At the join, the system suppresses <span className="mono">this.head_detail</span> and <span className="mono">walkway.start_post</span> to avoid double-counting. The self-closing gate + transition bracket are added by the WG-Coastal model.</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--ink-3)' }}>
          Optional. The system declares a walkway can attach at the ladder head — toggle <b>Include</b> to fold its materials into this take-off.
        </div>
      )}
    </section>
  );
}

function Bucket({
  label, sub, tone, children,
}: {
  label: string;
  sub: string;
  tone: 'derived' | 'preset' | 'open';
  children: ReactNode;
}) {
  const tones: Record<'derived' | 'preset' | 'open', { fg: string; bg: string }> = {
    derived: { fg: 'var(--accent)', bg: 'var(--selected)' },
    preset: { fg: 'var(--warn)', bg: 'var(--warn-soft)' },
    open: { fg: 'var(--ok)', bg: 'var(--ok-soft)' },
  };
  const t = tones[tone];
  return (
    <div style={at.bucket}>
      <div style={at.bucketHead}>
        <span style={{ ...at.bucketTag, color: t.fg, background: t.bg }} className="mono">{label}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function FieldRow({ name, value, badge }: { name: string; value: ReactNode; badge?: ReactNode }) {
  return (
    <div style={at.field}>
      <span className="mono" style={{ fontSize: 12, width: 120 }}>{name}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{value}</span>
      <span style={{ flex: 1 }} />
      {badge}
    </div>
  );
}

const at: Record<string, CSSProperties> = {
  declTag: {
    fontSize: 9, color: 'var(--ink-3)', background: 'var(--bg-2)',
    border: '1px solid var(--line-2)', padding: '1px 6px', borderRadius: 2,
  },
  includeBtn: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  },
  check: {
    width: 16, height: 16, borderRadius: 3, border: '1px solid var(--line-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
  },
  modelRow: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 12,
    marginBottom: 4, borderBottom: '1px solid var(--line)',
  },
  bucket: {
    marginTop: 10, padding: 12, background: 'var(--panel-2)',
    border: '1px solid var(--line)', borderRadius: 4,
  },
  bucketHead: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  bucketTag: {
    fontSize: 10, padding: '1px 7px', borderRadius: 2, textTransform: 'uppercase',
    letterSpacing: '0.04em', fontWeight: 600,
  },
  field: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '6px 8px',
    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 3,
  },
  fromTag: { fontSize: 10, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3 },
  lockTag: {
    fontSize: 10, color: 'var(--ink-2)', background: 'var(--bg-2)',
    border: '1px solid var(--line-2)', padding: '1px 6px', borderRadius: 2,
  },
  editTag: { fontSize: 10, color: 'var(--ok)' },
  suppressNote: {
    display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12,
    padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 4,
    fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5,
  },
};

const st: Record<string, CSSProperties> = {
  outer: { padding: '18px 20px 0', maxWidth: 1600, margin: '0 auto' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--line)',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  headStats: { display: 'flex', borderLeft: '1px solid var(--line)' },

  body: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 16, paddingBottom: 24, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  right: { minWidth: 0 },

  section: { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' },
  sectionHead: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    background: 'var(--panel-2)', borderBottom: '1px solid var(--line)',
  },
  sectionTitle: { margin: 0, fontSize: 13, fontWeight: 600 },

  kvGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px' },
  kv: {},
  kvK: { display: 'flex', alignItems: 'baseline', gap: 6 },
  kvSource: { fontSize: 9, color: 'var(--accent)' },

  chainWrap: { marginTop: 14, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 4 },
  chain: { display: 'flex', gap: 6, alignItems: 'stretch' },
  chainStep: { flex: 1, padding: '8px 10px', borderRadius: 3, border: '1px solid var(--line)', minWidth: 0 },

  varGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  varTile: { padding: 12, background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 4 },
  varTileSel: { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)', background: 'var(--selected)' },

  propRow: { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 8 },
  propHead: { display: 'flex', alignItems: 'flex-start', padding: '10px 14px', gap: 10 },
  archTag: { fontSize: 10, color: 'var(--ok)', background: '#E5EFE4', padding: '1px 6px', borderRadius: 2, fontFamily: 'var(--font-mono)' },
  gatedTag: { fontSize: 9, color: 'var(--annotation)', background: 'var(--annotation-soft)', padding: '1px 5px', borderRadius: 2 },
  propQty: { textAlign: 'right', minWidth: 50 },
  propBody: { padding: '0 14px 12px 14px', borderTop: '1px dashed var(--line)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px', paddingTop: 10 },
  algoOut: { gridColumn: '1 / -1', marginTop: 4, padding: '8px 10px', background: '#F0EBE0', borderRadius: 3 },

  mto: {
    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6,
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 60, maxHeight: 'calc(100vh - 100px)',
    boxShadow: 'var(--shadow-sticky)',
  },
  mtoHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '14px 16px', borderBottom: '1px solid var(--line)',
  },
  mtoTitle: { margin: 0, fontSize: 14, fontWeight: 600 },
  mtoSummary: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    background: 'var(--panel-2)', borderBottom: '1px solid var(--line)',
  },
  mtoRow: {
    display: 'flex', alignItems: 'center', padding: '8px 14px',
    borderBottom: '1px solid var(--line)', gap: 8,
  },
  mtoGroupHead: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
    background: '#F0ECF7', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
    fontSize: 11, fontWeight: 500, color: 'var(--prim-count)',
  },
  mtoName: { fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
