import { NextRequest, NextResponse } from 'next/server';

// NOTE: This is a placeholder. In production, securely store client secret server-side.
// For demo, expect environment vars GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';

export async function POST(req: NextRequest) {
  try {
  const { code, redirectUri, codeVerifier } = await req.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri || '',
      code_verifier: codeVerifier || '',
    });
    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: params,
    });
    const data = await r.json();
    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }
    return NextResponse.json({ access_token: data.access_token || null, scope: data.scope || '' });
  } catch (e) {
    return NextResponse.json({ error: 'OAuth exchange failed' }, { status: 500 });
  }
}
