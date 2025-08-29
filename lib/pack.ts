import { FileSystemTree } from './types';

// Simple varint (LEB128 style) helpers
function encodeVarint(n: number, out: number[]) {
  while (n > 0x7F) { out.push((n & 0x7F) | 0x80); n >>>= 7; }
  out.push(n & 0x7F);
}
function decodeVarint(view: Uint8Array, offset: number): [value: number, next: number] {
  let shift = 0, result = 0, i = offset;
  while (i < view.length) {
    const b = view[i++];
    result |= (b & 0x7F) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return [result, i];
}

// Pack only file entries. Directories reconstructed from paths.
// Format:
// magic: 'F' 'T'
// version: 0x01
// entryCount: varint
// For each entry:
//   pathLen varint, path utf8
//   flags (1 byte) bit0=isBinary bit1=hasContent
//   if hasContent: contentLen varint, content utf8

export function packTree(tree: FileSystemTree): Uint8Array {
  const files: { path: string; isBinary: boolean; content?: string }[] = [];
  for (const [id, node] of Object.entries(tree)) {
    // skip directory nodes (they have children) and undefined
    if (!node || (node as any).children) continue;
    const isBinary = !!node.isBinary;
    let content: string | undefined = undefined;
    if (!isBinary && typeof node.content === 'string') content = node.content;
    files.push({ path: id, isBinary, content });
  }
  const bytes: number[] = [];
  // header
  bytes.push(0x46, 0x54, 0x01); // 'F''T' v1
  encodeVarint(files.length, bytes);
  const enc = new TextEncoder();
  for (const f of files) {
    const pBytes = enc.encode(f.path);
    encodeVarint(pBytes.length, bytes);
    for (let i = 0; i < pBytes.length; i++) bytes.push(pBytes[i]);
    let flags = 0;
    if (f.isBinary) flags |= 1;
    if (f.content !== undefined) flags |= 2;
    bytes.push(flags);
    if (f.content !== undefined) {
      const cBytes = enc.encode(f.content);
      encodeVarint(cBytes.length, bytes);
      for (let i = 0; i < cBytes.length; i++) bytes.push(cBytes[i]);
    }
  }
  return new Uint8Array(bytes);
}

export function unpackTree(buf: Uint8Array): FileSystemTree {
  if (buf.length < 3 || buf[0] !== 0x46 || buf[1] !== 0x54) throw new Error('Bad pack header');
  if (buf[2] !== 0x01) throw new Error('Unsupported pack version');
  let offset = 3;
  const [entryCount, afterCount] = decodeVarint(buf, offset); offset = afterCount;
  const dec = new TextDecoder();
  const tree: FileSystemTree = {} as any;
  for (let i=0;i<entryCount;i++) {
    const [pLen, afterPLen] = decodeVarint(buf, offset); offset = afterPLen;
    const path = dec.decode(buf.subarray(offset, offset + pLen)); offset += pLen;
    const flags = buf[offset++];
    const isBinary = (flags & 1) !== 0;
    const hasContent = (flags & 2) !== 0;
    let content: string | undefined = undefined;
    if (hasContent) {
      const [cLen, afterCLen] = decodeVarint(buf, offset); offset = afterCLen;
      content = dec.decode(buf.subarray(offset, offset + cLen)); offset += cLen;
    }
    tree[path] = {
      id: path,
      name: path.split('/').pop() || path,
      isBinary,
      ...(content !== undefined ? { content } : {}),
    } as any;
  }
  // Reconstruct directory nodes
  const dirSet = new Set<string>();
  for (const path of Object.keys(tree)) {
    const parts = path.split('/');
    if (parts.length > 1) {
      let accum = '';
      for (let i=0;i<parts.length-1;i++) {
        accum += (i?'/':'') + parts[i];
        dirSet.add(accum + '/');
      }
    }
  }
  for (const dir of Array.from(dirSet)) {
    if (!tree[dir]) {
      tree[dir] = { id: dir, name: dir.split('/').filter(Boolean).pop() || dir, isBinary: false, children: [] } as any;
    }
  }
  // Populate children arrays
  for (const id of Object.keys(tree)) {
    if (id.endsWith('/')) {
      const children: string[] = [];
      const base = id;
  // baseDepth removed (unused)
      for (const other of Object.keys(tree)) {
        if (other === id) continue;
        if (other.startsWith(base)) {
          const rest = other.slice(base.length);
            if (!rest) continue;
          if (!rest.includes('/')) {
            children.push(other);
          } else if (rest.endsWith('/') && rest.indexOf('/') === rest.length-1) {
            // safe
          }
        }
      }
      (tree[id] as any).children = children;
    }
  }
  return tree;
}
