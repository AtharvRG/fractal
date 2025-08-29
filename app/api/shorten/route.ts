import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Expected table schema (create in your Supabase project):
// create table short_links (
//   id text primary key, -- short id
//   payload text not null, -- the long #h: compressed remainder
//   created_at timestamptz default now(),
//   expires_at timestamptz, -- nullable for no expiry
//   hit_count int default 0
// );
// create index on short_links (expires_at);

async function ensureNotExpired(rec: any) {
  if (!rec?.expires_at) return true;
  return new Date(rec.expires_at).getTime() > Date.now();
}

function makeId(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let out = '';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (let i=0;i<len;i++) out += chars[arr[i] % chars.length];
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, ttlSeconds } = await req.json();
    if (typeof payload !== 'string' || payload.length < 20) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    // Prefer a server-side client that can use service role for inserts if provided
    let supabase;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // never expose to client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: 'Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)' }, { status: 500 });
    }
    if (serviceKey) {
      supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    } else {
      supabase = getSupabaseClient();
    }
    let id = makeId();
    // attempt a few times to avoid collisions
    for (let i=0;i<5;i++) {
      const { data } = await supabase.from('short_links').select('id').eq('id', id).maybeSingle();
      if (!data) break;
      id = makeId();
    }
    const expires_at = ttlSeconds ? new Date(Date.now() + Math.min(ttlSeconds, 60*60*24*30)*1000).toISOString() : null; // cap at 30 days
    const { error } = await supabase.from('short_links').insert({ id, payload, expires_at }).select('id');
    if (error) {
      // insert error (silenced)
      return NextResponse.json({ error: 'Store failed', code: error.code, details: error.message }, { status: 500 });
    }
    return NextResponse.json({ id, expires_at });
  } catch (e) {
    // server exception (silenced)
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('short_links').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!(await ensureNotExpired(data))) return NextResponse.json({ error: 'Expired' }, { status: 410 });
    // Increment hit counter (fire and forget)
    supabase.from('short_links').update({ hit_count: (data.hit_count || 0) + 1 }).eq('id', id)
      .then(
        () => {},
        () => {}
      );
  return NextResponse.json({ payload: data.payload, expires_at: data.expires_at, hit_count: data.hit_count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('short_links').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}