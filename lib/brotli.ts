// Lightweight wrapper around brotli-wasm for synchronous compress/decompress in browser & Node.
// brotli-wasm exports async init. We lazy-init a singleton and expose async helpers.
let wasmMod: any = null;
let initPromise: Promise<void> | null = null;

async function ensure() {
  if (!initPromise) {
    initPromise = (async () => {
      // dynamic import to avoid SSR issues during build
      const mod: any = await import('brotli-wasm');
      if (mod.default) await mod.default();
      wasmMod = mod;
    })();
  }
  return initPromise;
}

export async function brotliCompress(data: Uint8Array, quality = 11): Promise<Uint8Array> {
  await ensure();
  return wasmMod.compress(data, { quality });
}

export async function brotliDecompress(data: Uint8Array): Promise<Uint8Array> {
  await ensure();
  return wasmMod.decompress(data);
}
