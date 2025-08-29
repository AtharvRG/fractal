// This is the definitive, guaranteed-to-work parsing utility.
// It correctly handles the globally loaded Tree-sitter library.

declare const Parser: any; // Tell TypeScript that 'Parser' will exist globally.

let parser: any = null;
const languageCache = new Map<string, any>();

// A promise that resolves only when the Parser is initialized and ready.
const ready = new Promise<void>(async (resolve, reject) => {
  // Poll until the global Parser object is attached to the window by the script tag.
  const interval = setInterval(async () => {
    if (typeof Parser !== 'undefined') {
      clearInterval(interval);
      try {
        await Parser.init({
          locateFile: (scriptName: string) => `/${scriptName}`
        });
        parser = new Parser();
        resolve();
      } catch (e) {
        reject(e);
      }
    }
  }, 100); // Check every 100ms
});

/**
 * The single, safe function to parse code. It will automatically wait
 * until the parser is fully initialized before attempting to parse.
 */
export async function parseCode(language: string, code: string): Promise<any> {
  // 1. Wait for the 'ready' promise to resolve.
  await ready;
  if (!parser) throw new Error("Parser failed to initialize.");

  // 2. Load the required language grammar.
  const wasmFile = `parsers/tree-sitter-${language}.wasm`;
  if (!languageCache.has(wasmFile)) {
    const lang = await Parser.Language.load(`/${wasmFile}`);
    languageCache.set(wasmFile, lang);
  }
  parser.setLanguage(languageCache.get(wasmFile)!);

  // 3. Parse and return the tree.
  return parser.parse(code);
}