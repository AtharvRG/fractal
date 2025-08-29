import { NextRequest, NextResponse } from 'next/server';

// In-memory ephemeral store (resets on redeploy/restart). For production, replace with Redis/KV.
const store: Map<string, { compressed: string; ts: number; }> = new Map();
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function gc() {
  const now = Date.now();
  store.forEach((v,k) => { if (now - v.ts > TTL_MS) store.delete(k); });
}

function makeId(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let out = '';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (let i=0;i<len;i++) out += chars[arr[i] % chars.length];
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { compressed } = await req.json();
    if (typeof compressed !== 'string' || compressed.length < 10) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    gc();
    let id = makeId();
    // Extremely low collision chance, but guard anyway
    while (store.has(id)) id = makeId();
    store.set(id, { compressed, ts: Date.now() });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Store failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  gc();
  const rec = store.get(id);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ compressed: rec.compressed });
}
