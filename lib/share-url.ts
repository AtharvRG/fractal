import * as pako from 'pako';
import { FileSystemTree } from './types';
import { packTree, unpackTree } from './pack';
import { brotliCompress, brotliDecompress } from './brotli';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB (characters)
const URL_THRESHOLD = 10 * 1024 * 1024; // 10 MB

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}
function fromBase64Url(b64: string): Uint8Array {
  let std = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = std.length % 4; if (pad) std += '===='.slice(pad);
  const bin = atob(std);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Compression algorithm markers: '0'=gzip, '1'=brotli
type AlgoMarker = '0' | '1';

// Ambient declarations for TS when lib.dom.d.ts lacks 'br' literal types in CompressionFormat
// (Runtime will throw if unsupported; we handle via try/catch.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type __CompressionFormatHack = 'gzip' | 'deflate' | 'deflate-raw' | 'br';

export async function compressProject(tree: FileSystemTree): Promise<{ compressed: string; byteLength: number; algo: AlgoMarker; rawPackedBytes: number; }> {
  const packed = packTree(tree);
  let algo: AlgoMarker = '1';
  let comp: Uint8Array;
  try {
    comp = await brotliCompress(packed, 11);
    if (!comp.length) throw new Error('empty');
  } catch {
    algo = '0';
    comp = pako.gzip(packed, { level: 9 });
  }
  const withMarker = new Uint8Array(comp.length + 1);
  withMarker[0] = algo.charCodeAt(0);
  withMarker.set(comp, 1);
  const compressed = toBase64Url(withMarker);
  return { compressed, byteLength: compressed.length, algo, rawPackedBytes: packed.length };
}

async function sha256HexFirst8(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  return arr.slice(0,8);
}

function encodeChunk(chunk: string): string {
  // encode chunk (plain text) to UTF-8 bytes then base64url
  const bytes = new TextEncoder().encode(chunk);
  return toBase64Url(bytes);
}

function decodeChunk(segment: string): string {
  const bytes = fromBase64Url(segment);
  return new TextDecoder().decode(bytes);
}

export async function buildUrlShare(baseOrigin: string, compressed: string): Promise<{ url: string; segments: string[]; checksum: string; }>{
  const segments: string[] = [];
  for (let i=0;i<compressed.length;i+=CHUNK_SIZE) {
    const chunk = compressed.slice(i, i+CHUNK_SIZE);
    segments.push(encodeChunk(chunk));
  }
  const checksum = await sha256HexFirst8(compressed);
  const fullSegments = [...segments, checksum];
  const url = `${baseOrigin}/editor/#h:${fullSegments.join(',')}`;
  return { url, segments: fullSegments, checksum };
}

export function exceedsUrlThreshold(compressedLength: number): boolean {
  return compressedLength > URL_THRESHOLD;
}

export async function decodeUrlShare(hashRemainder: string): Promise<{ tree: FileSystemTree | null; error?: string; }> {
  try {
    const parts = hashRemainder.split(',').filter(Boolean);
    if (parts.length < 2) return { tree: null, error: 'Malformed link' };
    const checksum = parts[parts.length -1];
    const dataSegments = parts.slice(0, -1);
    const reconstructed = dataSegments.map(decodeChunk).join('');
    const calc = await sha256HexFirst8(reconstructed);
    if (calc !== checksum) {
      return { tree: null, error: 'Checksum mismatch' };
    }
    // Decode base64url -> decompress per algo marker (or legacy)
    const markerBytes = fromBase64Url(reconstructed);
    if (!markerBytes.length) return { tree: null, error: 'Empty payload' };
    let raw: Uint8Array;
    const markerChar = String.fromCharCode(markerBytes[0]);
    if (markerChar === '0' || markerChar === '1') {
      const body = markerBytes.subarray(1);
      if (markerChar === '1') {
        try { raw = await brotliDecompress(body); } catch { try { raw = pako.ungzip(body); } catch { return { tree: null, error: 'Decompress failed' }; } }
      } else {
        try { raw = pako.ungzip(body); } catch { try { raw = await brotliDecompress(body); } catch { return { tree: null, error: 'Decompress failed' }; } }
      }
    } else {
      // legacy path (no marker originally) treat entire blob as gzip
      try { raw = pako.ungzip(markerBytes); } catch { return { tree: null, error: 'Unknown compression' }; }
    }
    let tree: FileSystemTree | null = null;
    try {
      tree = unpackTree(raw);
    } catch {
      // fallback attempt legacy JSON
      try {
        const json = new TextDecoder().decode(raw);
        tree = JSON.parse(json) as FileSystemTree;
      } catch {
        return { tree: null, error: 'Unsupported payload' };
      }
    }
    return { tree };
  } catch (e) {
    return { tree: null, error: 'Decode failed' };
  }
}

// Short link retrieval: fetch compressed blob via id and then decode standard format (expects same comma+checksum format)
export async function fetchAndDecodeShort(baseOrigin: string, id: string): Promise<{ tree: FileSystemTree | null; error?: string; }> {
  try {
    const res = await fetch(`${baseOrigin}/api/share?id=${encodeURIComponent(id)}`);
    if (!res.ok) return { tree: null, error: 'Short link fetch failed' };
    const data = await res.json();
    if (!data.compressed) return { tree: null, error: 'No data in short link' };
    return decodeUrlShare(data.compressed);
  } catch {
    return { tree: null, error: 'Short link network error' };
  }
}
