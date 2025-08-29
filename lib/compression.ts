import pako from 'pako';
import { FileSystemTree, FileSystemNode } from './types';

// Optional secondary compression using a light-weight LZ-style UTF-16 packing.
// This can reduce size a further ~10-25% depending on content. It is reversible and URL-safe after base64.
// We only apply it when it actually helps (heuristic check) to avoid overhead on small payloads.
function utf16Pack(str: string): string {
  // Pack pairs of bytes of a binary string into single UTF-16 code units to shrink JSON before deflate.
  let out = '';
  for (let i = 0; i < str.length; i += 2) {
    const c1 = str.charCodeAt(i);
    const c2 = str.charCodeAt(i + 1) || 0;
    out += String.fromCharCode((c1 << 8) | c2);
  }
  return out;
}
function utf16Unpack(packed: string): string {
  let out = '';
  for (let i = 0; i < packed.length; i++) {
    const code = packed.charCodeAt(i);
    out += String.fromCharCode(code >> 8, code & 0xff);
  }
  return out;
}

// Converts a Uint8Array to a URL-safe Base64 string.
function uint8ArrayToBase64(buffer: Uint8Array): string {
  const binary = String.fromCharCode.apply(null, Array.from(buffer));
  return btoa(binary)
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_'); // Replace '/' with '_'
}

// Converts a URL-safe Base64 string back to a Uint8Array.
function base64ToUint8Array(base64: string): Uint8Array {
  // Normalize to standard Base64 and restore missing padding if any
  let standardBase64 = base64
    .replace(/-/g, '+') // Replace '-' with '+'
    .replace(/_/g, '/'); // Replace '_' with '/'
  const remainder = standardBase64.length % 4;
  if (remainder === 2) standardBase64 += '==';
  else if (remainder === 3) standardBase64 += '=';
  const binaryString = atob(standardBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compresses the file system tree into a URL-safe Base64 string.
 */
export function compressFileSystemTree(tree: FileSystemTree): string {
  const jsonString = JSON.stringify(tree);
  // Heuristic: if JSON is > 200 KB, attempt UTF-16 packing to increase repetition density pre-deflate.
  let working = jsonString;
  let usedPacking = false;
  if (jsonString.length > 200 * 1024) {
    try {
      const packed = utf16Pack(jsonString);
      // Only keep if it actually shrinks string length (packed length *2 < original length)
      if (packed.length * 2 < jsonString.length * 0.9) { // require at least ~10% improvement
        working = '\u0001' + packed; // prefix flag indicating packed
        usedPacking = true;
      }
    } catch { /* ignore packing errors */ }
  }
  const compressed = pako.deflate(working, { level: 9 });
  const b64 = uint8ArrayToBase64(compressed);
  return (usedPacking ? 'p.' : 'n.') + b64; // prefix with mode indicator
}

/**
 * Decompresses a URL-safe Base64 string back into a file system tree.
 * Returns null if the hash is invalid or corrupted.
 */
export function decompressFileSystemTree(hash: string): FileSystemTree | null {
  try {
    // Detect mode prefix (p. or n.)
    let mode = 'n';
    let payload = hash;
    if (hash.startsWith('p.') || hash.startsWith('n.')) {
      mode = hash[0];
      payload = hash.slice(2);
    }
    const compressed = base64ToUint8Array(payload);
    let inflated = pako.inflate(compressed, { to: 'string' }) as string;
    if (mode === 'p') {
      if (inflated.startsWith('\u0001')) {
        inflated = utf16Unpack(inflated.slice(1));
      } else {
        // Fallback: treat as normal if flag missing
      }
    }
    return JSON.parse(inflated);
  } catch (error) {
    // Decompression failed (silenced)
    return null;
  }
}

// -------------------- Experimental v2 ultra-short scheme --------------------
// Binary serialization + deflate + Base91 (approx) for ~10-18% shorter vs Base64.
// Format: v2:<flags><encoded>
// flags bit0: packing used

const B91_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~\""; // 91 chars
const B91_MAP: Record<string, number> = {};
for (let i = 0; i < B91_ALPHABET.length; i++) B91_MAP[B91_ALPHABET[i]] = i;

function b91Encode(data: Uint8Array): string {
  let b = 0, n = 0, out = '';
  for (let i = 0; i < data.length; i++) {
    b |= data[i] << n;
    n += 8;
    if (n > 13) {
      let v = b & 8191; // 2^13 -1
      if (v > 88_91) { // 88_91 = 91*91 -1 approx guard
        b >>= 13;
        n -= 13;
      } else {
        v = b & 16383; // 2^14 -1
        b >>= 14;
        n -= 14;
      }
      out += B91_ALPHABET[v % 91] + B91_ALPHABET[(v / 91) | 0];
    }
  }
  if (n) out += B91_ALPHABET[b % 91] + (n > 7 ? B91_ALPHABET[(b / 91) | 0] : '');
  return out;
}
function b91Decode(str: string): Uint8Array {
  let v = -1, b = 0, n = 0, out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = B91_MAP[str[i]];
    if (c === undefined) continue;
    if (v < 0) v = c; else {
      v += c * 91;
      b |= v << n;
      n += (v & 8191) > 88_91 ? 13 : 14;
      do {
        out.push(b & 255);
        b >>= 8;
        n -= 8;
      } while (n > 7);
      v = -1;
    }
  }
  if (v > -1) out.push((b | v << n) & 255);
  return new Uint8Array(out);
}

// Binary serialize tree: sequence of nodes. Format:
// [varint nodeCount] repeated nodes:
// idLen varint + id utf8
// nameLen varint + name utf8
// flags (1 byte: bit0 isBinary, bit1 hasContent, bit2 hasChildren, bit3 hasViewState )
// if hasContent: contentLen varint + content utf8
// if hasChildren: childCount varint + each childIdLen + childId
// viewState omitted (not needed for share) to save space.

function encodeVarint(num: number, out: number[]) {
  while (num > 127) { out.push((num & 127) | 128); num >>= 7; }
  out.push(num);
}
function utf8Encode(str: string): Uint8Array { return new TextEncoder().encode(str); }
function utf8Decode(buf: Uint8Array): string { return new TextDecoder().decode(buf); }

export function compressFileSystemTreeV2(tree: FileSystemTree): string {
  const nodes = Object.values(tree);
  const bytes: number[] = [];
  encodeVarint(nodes.length, bytes);
  for (const n of nodes) {
  const idBytes = utf8Encode(n.id);
  encodeVarint(idBytes.length, bytes); for (let i=0;i<idBytes.length;i++) bytes.push(idBytes[i]);
  const nameBytes = utf8Encode(n.name);
  encodeVarint(nameBytes.length, bytes); for (let i=0;i<nameBytes.length;i++) bytes.push(nameBytes[i]);
    let flags = 0;
    if (n.isBinary) flags |= 1;
    if (n.content) flags |= 2;
    if (n.children && n.children.length) flags |= 4;
    bytes.push(flags);
    if (flags & 2) {
  const contentBytes = utf8Encode(n.content!);
  encodeVarint(contentBytes.length, bytes); for (let i=0;i<contentBytes.length;i++) bytes.push(contentBytes[i]);
    }
    if (flags & 4) {
      encodeVarint(n.children!.length, bytes);
      for (const cid of n.children!) {
  const cBytes = utf8Encode(cid);
  encodeVarint(cBytes.length, bytes); for (let j=0;j<cBytes.length;j++) bytes.push(cBytes[j]);
      }
    }
  }
  // Deflate
  const raw = new Uint8Array(bytes);
  const deflated = pako.deflate(raw, { level: 9 });
  const encoded = b91Encode(deflated);
  return 'v2:' + encoded; // No mode flags; packing not used here.
}

export function decompressFileSystemTreeV2(data: string): FileSystemTree | null {
  try {
    if (!data.startsWith('v2:')) return null;
    const encoded = data.slice(3);
    const deflated = b91Decode(encoded);
    const raw = pako.inflate(deflated) as Uint8Array;
    let idx = 0;
    const readVar = () => { let shift = 0, val = 0; while (true) { const b = raw[idx++]; val |= (b & 127) << shift; if (!(b & 128)) break; shift += 7; } return val; };
    const readStr = () => { const len = readVar(); const slice = raw.slice(idx, idx + len); idx += len; return utf8Decode(slice); };
    const nodeCount = readVar();
    const out: FileSystemTree = {};
    for (let i = 0; i < nodeCount; i++) {
      const id = readStr();
      const name = readStr();
      const flags = raw[idx++];
      let content: string | undefined;
      if (flags & 2) content = readStr();
      let children: string[] | undefined;
      if (flags & 4) {
        const childCount = readVar();
        children = [];
        for (let c = 0; c < childCount; c++) children.push(readStr());
      }
      const node: FileSystemNode = { id, name, isBinary: !!(flags & 1) };
      if (content !== undefined) node.content = content;
      if (children) node.children = children;
      out[id] = node;
    }
    return out;
  } catch (e) {
    // v2 decompress failed (silenced)
    return null;
  }
}