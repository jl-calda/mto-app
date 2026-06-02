import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

// Visual upload. With Supabase configured → Storage bucket 'visuals' (public URL).
// In the in-memory / no-Supabase mode → returns a data URL, which round-trips as
// the visual's url just the same (fine for the seed workspace).
const MAX_BYTES = 5_000_000;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no file provided' }, { status: 400 });

  const type = file.type || 'image/png';
  if (!type.startsWith('image/')) {
    return NextResponse.json({ error: `not an image (${type})` }, { status: 415 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: `image too large (${Math.round(bytes.byteLength / 1024)} KB, max ${MAX_BYTES / 1024} KB)` }, { status: 413 });
  }

  const db = getServiceClient();
  if (db) {
    const safe = (file.name || 'image').replace(/[^\w.-]+/g, '_');
    const path = `${crypto.randomUUID()}-${safe}`;
    const { error } = await db.storage.from('visuals').upload(path, bytes, { contentType: type, upsert: false });
    if (!error) {
      const { data } = db.storage.from('visuals').getPublicUrl(path);
      return NextResponse.json({ url: data.publicUrl });
    }
    // fall through to the data-URL fallback if storage isn't set up
  }

  const b64 = Buffer.from(bytes).toString('base64');
  return NextResponse.json({ url: `data:${type};base64,${b64}` });
}
