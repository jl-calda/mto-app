// Inventory — cross-project stock / offcut pool (v3).

export type InventoryOrigin =
  | { kind: 'purchased'; purchase_order: string; purchased_at: number }
  | { kind: 'offcut'; source_takeoff_id: string; source_stock_id: string }
  | { kind: 'manual'; note: string };

export type InventoryItem = {
  id: string;
  material_id: string;
  length?: number;
  quantity?: number;
  origin: InventoryOrigin;
  status: 'available' | 'reserved' | 'consumed';
  reserved_for_takeoff_id?: string;
  notes?: string;
};
