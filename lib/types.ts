// Shared domain types for the MTO app.
// Kept intentionally small for the take-off-ladder screen; the full data model
// from the engineering brief can be layered in as later screens are built.

/** Visual identifier carried by every browsable entity (material, system, …). */
export type Visual =
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'emoji'; char: string }
  | { kind: 'icon'; name: string }
  | { kind: 'none' };

/** A single line on a Material Take-Off. */
export type MtoLine = {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  /** Source rule id — surfaced for line→rule traceability. */
  rule: string;
  /** Plain/derived formula behind the quantity — surfaced for "show derived". */
  formula: string;
};
