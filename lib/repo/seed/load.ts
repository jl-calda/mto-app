import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { seed } from './index';

type Row = Record<string, unknown>;

async function up(db: SupabaseClient, table: string, rows: Row[], onConflict?: string) {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) throw new Error(`seed ${table}: ${error.message}`);
}

/**
 * Upserts the in-memory seed into Supabase (DRY — single source of truth is the
 * TS `seed`). Order respects FKs. Run once via POST /api/seed after env is set.
 */
export async function loadSeedIntoSupabase(db: SupabaseClient): Promise<{ ok: true }> {
  await up(db, 'material', seed.materials.map((m) => ({
    id: m.id, sku: m.sku, name: m.name, vendor: m.vendor, unit: m.unit,
    category: m.category ?? null, is_cuttable: m.is_cuttable, payload: m,
  })));

  await up(db, 'variant', seed.variants.map((v) => ({
    id: v.id, name: v.name, status: v.status, current_version: v.current_version, payload: v,
  })));
  await up(db, 'variant_version', seed.variants.flatMap((v) =>
    v.versions.map((ver) => ({
      variant_id: v.id, version: ver.version, published_at: ver.published_at,
      changelog: ver.changelog, payload: ver,
    })),
  ), 'variant_id,version');

  await up(db, 'sub_assembly', seed.subAssemblies.map((s) => ({
    id: s.id, name: s.name, category: s.category ?? null, status: s.status,
    current_version: s.current_version, payload: s,
  })));
  await up(db, 'sub_assembly_version', seed.subAssemblies.flatMap((s) =>
    s.versions.map((ver) => ({
      sub_assembly_id: s.id, version: ver.version, published_at: ver.published_at,
      changelog: ver.changelog, payload: ver,
    })),
  ), 'sub_assembly_id,version');

  await up(db, 'system', seed.systems.map((s) => ({
    id: s.id, name: s.name, description: s.description ?? null,
    primitive_kind: s.primitive.kind, payload: s,
  })));
  await up(db, 'model', seed.systems.flatMap((s) =>
    s.models.map((m) => ({
      id: m.id, system_id: m.system_id, name: m.name, status: m.status,
      current_version: m.current_version ?? null, payload: m,
    })),
  ));

  await up(db, 'project', seed.projects.map((p) => ({
    id: p.id, name: p.name, client: p.client, location: p.location ?? null, payload: p,
  })));
  await up(db, 'takeoff', seed.projects.flatMap((p) =>
    p.takeoffs.map((t) => ({
      id: t.id, project_id: p.id, system_id: t.system_id, model_id: t.model_id,
      name: t.name, status: 'draft', payload: t,
    })),
  ));

  await up(db, 'inventory_item', seed.inventory.map((i) => ({
    id: i.id, material_id: i.material_id, length: i.length ?? null,
    quantity: i.quantity ?? null, status: i.status, payload: i,
  })));

  return { ok: true };
}
