// Lightweight token obfuscation utilities (NOT strong security) to avoid storing
// the GitHub token in plain text; avoids WebCrypto typing complexity in this demo.

const TOKEN_KEY_NAME = 'gh_tok_key_v1';
const TOKEN_CIPHERTEXT_NAME = 'gh_tok_ct_v1';

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i=0;i<arr.length;i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromB64url(b64: string): Uint8Array {
  let std = b64.replace(/-/g,'+').replace(/_/g,'/');
  const pad = std.length % 4; if (pad) std += '===='.slice(pad);
  const bin = atob(std);
  const out = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}

function deriveXorKey(): Uint8Array {
  let stored = sessionStorage.getItem(TOKEN_KEY_NAME);
  if (!stored) {
    const rand = crypto.getRandomValues(new Uint8Array(32));
    stored = b64url(rand);
    sessionStorage.setItem(TOKEN_KEY_NAME, stored);
  }
  return fromB64url(stored);
}

export async function persistGithubTokenEncrypted(token: string) {
  try {
    const key = deriveXorKey();
    const bytes = new TextEncoder().encode(token);
    const out = new Uint8Array(bytes.length);
    for (let i=0;i<bytes.length;i++) out[i] = bytes[i] ^ key[i % key.length];
    sessionStorage.setItem(TOKEN_CIPHERTEXT_NAME, b64url(out));
  } catch {/* ignore */}
}

export async function restoreGithubTokenDecrypted(): Promise<string | null> {
  try {
    const ct = sessionStorage.getItem(TOKEN_CIPHERTEXT_NAME);
    if (!ct) return null;
    const key = deriveXorKey();
    const bytes = fromB64url(ct);
    const out = new Uint8Array(bytes.length);
    for (let i=0;i<bytes.length;i++) out[i] = bytes[i] ^ key[i % key.length];
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

// Utilities for PKCE + state management (client side demo only)
const PKCE_VERIFIER_KEY = 'gh_pkce_verifier_v1';
const OAUTH_STATE_KEY = 'gh_oauth_state_v1';

export function generateRandomString(bytes = 32): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return b64url(arr);
}

export async function createPkceChallenge(): Promise<{ verifier: string; challenge: string; state: string; }> {
  const verifier = generateRandomString(48); // 48*4/3 ~64 chars within spec
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = b64url(digest);
  const state = generateRandomString(16);
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  return { verifier, challenge, state };
}

export function consumePkce(): { verifier: string | null; state: string | null; } {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const state = sessionStorage.getItem(OAUTH_STATE_KEY);
  return { verifier, state };
}

export function clearPkce() {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
}
