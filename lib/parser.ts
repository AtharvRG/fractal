// This is the definitive, stable, main-thread parsing utility.
// It will only ever be loaded on the client.
// Using web-tree-sitter 0.25.8 with proper TypeScript handling

let TreeSitter: any = null;
let isInitialized = false;
const languageCache = new Map<string, any>();

async function initialize() {
  if (isInitialized || typeof window === 'undefined') return;

  try {
  // initialize web-tree-sitter
    
    // Import TreeSitter module and handle TypeScript properly
    const TreeSitterModule = await import('web-tree-sitter');
  // module imported
    
    // Cast to any to bypass TypeScript limitations
    const tsModule = TreeSitterModule as any;
    
  // web-tree-sitter API variations:
    // - Some builds export a top-level `init` function
    // - Some expose a `Parser` class with a static `init` method
    // - Some default-export an initializer function/module
    // Prefer calling Parser.init when available to satisfy the "cannot construct a Parser before calling `init()`" requirement.
  const locateFile = (scriptName: string, _scriptDirectory: string) => {
      // Prefer the /parsers/ folder where wasm files live in this app's public/ folder
      return `/parsers/${scriptName}`;
    };

  // Minimal diagnostics
  // check for Parser presence

    if (tsModule.Parser && typeof tsModule.Parser.init === 'function') {
      await tsModule.Parser.init({ locateFile });
    } else if (typeof tsModule.init === 'function') {
      await tsModule.init({ locateFile });
    } else if (tsModule.default && typeof tsModule.default.init === 'function') {
      await tsModule.default.init({ locateFile });
    } else if (typeof tsModule === 'function') {
      // Some UMD/legacy builds export a function as the module itself
      await tsModule({ locateFile });
    } else {
      // No explicit init found; try local bundle fallback
      try {
        // Try to load the prebuilt bundle in /public/tree-sitter.js by injecting a script tag at runtime
        await new Promise<void>((resolve, reject) => {
          if (typeof window === 'undefined') return reject(new Error('Not in browser'));
          // If already loaded, resolve
          if ((window as any).tree_sitter_default || (window as any).Module) return resolve();
          const script = document.createElement('script');
          script.src = '/tree-sitter.js';
          script.async = true;
          script.onload = () => {
            // Give the module a tick to initialize
            setTimeout(() => resolve(), 0);
          };
          script.onerror = () => reject(new Error('Failed to load /tree-sitter.js'));
          document.head.appendChild(script);
        });

  // The bundle should expose a factory on window.tree_sitter_default or a Module function
  const bundleGlobal = (window as any).tree_sitter_default || (window as any).Module || (window as any).createModule;

        let binding: any = null;
        if (typeof bundleGlobal === 'function') {
          binding = await bundleGlobal({ locateFile });
        } else if ((window as any).tree_sitter_default && typeof (window as any).tree_sitter_default === 'object') {
          binding = (window as any).tree_sitter_default;
        }

        // If we obtained a binding, try to wire it into Parser via Parser.init if available
    if (binding) {
          // If the original tsModule has Parser.init static, call it with the binding
          const ParserCtor = tsModule.Parser || tsModule.default?.Parser || binding.Parser;
          if (ParserCtor && typeof ParserCtor.init === 'function') {
            await ParserCtor.init({ locateFile });
          } else if (binding.Parser && typeof binding.Parser.init === 'function') {
            await binding.Parser.init({ locateFile });
          } else {
      // assume initialization finished
          }

          // Prefer using binding if it exposes Parser/Language
          if (binding.Parser && binding.Language) {
    TreeSitter = binding;
          }
        } else {
          // As a last resort, attempt to create a test parser from the original module
          const TestParser = tsModule.Parser || tsModule.default?.Parser;
          if (TestParser) {
  const testParser = new TestParser();
    testParser.delete?.(); // Clean up
    TreeSitter = tsModule;
          } else {
            throw new Error('No Parser constructor found after loading bundle');
          }
        }
      } catch (error) {
        throw new Error(`TreeSitter initialization failed via bundle fallback: ${error}`);
      }
    }
    
    TreeSitter = TreeSitter || tsModule;
  isInitialized = true;
    
  } catch (error) {
    // Failed to initialize TreeSitter (silenced)
    throw error;
  }
}

async function getLanguage(language: string): Promise<any> {
  const wasmFile = `parsers/tree-sitter-${language}.wasm`;
  if (languageCache.has(wasmFile)) {
    return languageCache.get(wasmFile);
  }
  
  try {
    if (!TreeSitter) {
      throw new Error('TreeSitter not initialized');
    }
    
  // loading language
    
    // Try different ways to access Language.load
    let lang: any;
    if (TreeSitter.Language && TreeSitter.Language.load) {
      lang = await TreeSitter.Language.load(`/${wasmFile}`);
    } else if (TreeSitter.default && TreeSitter.default.Language && TreeSitter.default.Language.load) {
      lang = await TreeSitter.default.Language.load(`/${wasmFile}`);
    } else {
      throw new Error('Cannot find Language.load method');
    }
    
  // language loaded
    languageCache.set(wasmFile, lang);
    return lang;
  } catch (error) {
    // Failed to load language (silenced)
    return null;
  }
}

/**
 * Parse code using web-tree-sitter 0.25.8
 */
export async function parseCode(language: string, code: string): Promise<any> {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }

  try {
    if (!code || code.length === 0) {
      // empty code, nothing to parse
      return null;
    }
    
    // Initialize TreeSitter
    await initialize();
    
    if (!TreeSitter || !isInitialized) {
      // TreeSitter initialization failed (silenced)
      return null;
    }
    
    // Load the language
    const languageGrammar = await getLanguage(language);
    if (!languageGrammar) {
      // Failed to load grammar (silenced)
      return null;
    }
    
    // Create parser
    let parser: any;
    if (TreeSitter.Parser) {
      parser = new TreeSitter.Parser();
    } else if (TreeSitter.default && TreeSitter.default.Parser) {
      parser = new TreeSitter.default.Parser();
    } else {
      throw new Error('Cannot find Parser constructor');
    }
    
    // Set language and parse
    parser.setLanguage(languageGrammar);
  const tree = parser.parse(code);
  return tree;
    
  } catch (error) {
    // Parsing failed (silenced)
    return null;
  }
}