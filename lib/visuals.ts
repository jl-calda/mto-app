// Client helper for the visual upload flow. The optimistic state (instant local
// preview → swap to the returned URL → rollback on error) lives in the editor;
// this just posts the file to the upload endpoint.

export async function uploadVisualFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file, file.name || 'pasted.png');
  const res = await fetch('/api/visuals', { method: 'POST', body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || `upload failed (${res.status})`);
  return data.url;
}
