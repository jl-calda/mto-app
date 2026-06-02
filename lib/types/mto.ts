// MTO output — the procurement bill of materials produced by the engine.

import type { Visual } from './visual';
import type { PropertyScope } from './property';

export type MtoLine = {
  sku: string;
  material_visual?: Visual;
  description: string;
  qty: number;
  unit: string;
  source_material_id: string;
  source_rule_id?: string;
  source_sub_assembly?: string;
  source_attachment?: string;
  scope?: PropertyScope;
  cutting_plan?: CuttingPlan;
  inventory_used?: string[]; // v3
  notes?: string;
};

export type CuttingPlan = {
  per_stock: {
    stock_id?: string; // v3, if from inventory
    stock_length: number;
    cuts: CutDetail[];
    offcut: number;
    kerf_total: number;
  }[];
};

export type CutDetail = {
  length: number;
  source_material_id?: string;
  source_rule_id?: string;
  source_sub_assembly?: string;
  position_in_stock: [number, number];
};
