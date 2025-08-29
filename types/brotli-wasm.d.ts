declare module 'brotli-wasm' {
  export function compress(data: Uint8Array, opts?: { quality?: number }): Uint8Array;
  export function decompress(data: Uint8Array): Uint8Array;
  const init: () => Promise<void>;
  export default init;
}
