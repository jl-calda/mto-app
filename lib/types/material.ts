// Materials — the global SKU catalogue.

import type { AttrValue } from './common';
import type { Visual } from './visual';

export type MaterialUnit = 'ea' | 'lin.m' | 'kg' | 'set' | 'hr' | (string & {});

export type Material = {
  id: string;
  visual?: Visual;
  sku: string;
  name: string;
  description?: string;
  vendor: string;
  unit: MaterialUnit;
  category?: string;
  attributes: Record<string, AttrValue>;
  is_cuttable: boolean;
  stock_options?: number[];
  cut_allowance?: number;
  min_offcut_to_retain?: number;
  datasheets?: { type: 'image' | 'datasheet'; url: string }[];
};
