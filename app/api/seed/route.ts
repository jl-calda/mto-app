import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { loadSeedIntoSupabase } from '@/lib/repo/seed/load';

// One-time seed loader. Guard with SEED_TOKEN; call with header `x-seed-token`.
//   curl -X POST $APP_URL/api/seed -H "x-seed-token: $SEED_TOKEN"
export async function POST(req: Request) {
  const token = process.env.SEED_TOKEN;
  if (!token || req.headers.get('x-seed-token') !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
  }
  try {
    await loadSeedIntoSupabase(db);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
