// Warnings — surfaced without blocking (critical errors block save; warnings don't).

export type WarningType =
  | 'high_wastage'
  | 'grid_too_sparse'
  | 'compliance_violation'
  | 'geometry_mismatch'
  | 'missing_sku'
  | 'variant_version_mismatch'
  | 'span_uncovered'
  | 'cut_too_long'
  | 'mount_surface_overflow'
  | 'placement_rule_unsatisfiable'
  | 'inventory_exhausted'
  // engine-internal:
  | 'non_convergence';

export type Warning = {
  level: 'info' | 'warning' | 'error';
  source: 'algorithm' | 'validation' | 'compliance' | 'version' | 'inventory' | 'engine';
  /** Optional machine-readable category (see WarningType). */
  type?: WarningType;
  message: string;
  affected_fields?: string[];
};
