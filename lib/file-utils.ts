import { FileSystemTree } from './types';

// Define constants for file processing
// We still treat files > 10 MB as "large" (read-only / binary in UI) per original spec,
// but we now KEEP their content so that the share dialog can correctly measure
// total project size and force a Gist fallback instead of silently shrinking data.
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10 MB (raw size trigger for Gist fallback)
// Hard safety cap to avoid ingesting extremely huge single files (protect memory)
const ABSOLUTE_MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const READABLE_EXTENSIONS = new Set([
    // Programming & scripting
    'py','js','mjs','cjs','ts','tsx','jsx','go','rs','c','h','cpp','hpp','cc','hh','java','kt','kts','rb','php','swift','m','mm','scala','groovy','gradle','cs','vb','ps1','psm1','bash','sh','zsh','fish','lua','r','pl','pm','erl','ex','exs','clj','cljs','edn','dart','nim','zig','elm','sql','psql','prisma','ino',
    // Markup / web
    'html','htm','xml','xsd','xsl','xslt','svg','vue','svelte',
    // Styles & preprocessing
    'css','scss','sass','less','styl',
    // Data / config
    'json','jsonc','ndjson','yaml','yml','toml','ini','conf','config','properties','env','dotenv','plist','cue',
    // Docs / prose
    'md','markdown','txt','log','rst','adoc','org','csv','tsv','psv','tex',
    // Misc code-related text
    'makefile','gnumakefile','dockerfile','dockerignore','gitignore','gitattributes','editorconfig','nnf','tt','tf','tfvars','lock','patch','diff'
]);

/**
 * Async classification: uses extension whitelist, a binary extensions blacklist,
 * MIME hints, and a few magic-number checks to detect common binary formats.
 * Returns whether we should read the full content, whether the UI should treat
 * the file as binary (non-editable placeholder), and whether it's "large".
 */
async function classifyFile(file: File): Promise<{ shouldRead: boolean; treatAsBinary: boolean; isLarge: boolean }> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isLarge = file.size > LARGE_FILE_THRESHOLD;

    // Conservative rule: explicit readable extensions remain editable.
    if (READABLE_EXTENSIONS.has(extension)) {
        if (file.size > ABSOLUTE_MAX_FILE_BYTES) {
            // Only at hard cap do we refuse to read and mark binary placeholder
            return { shouldRead: false, treatAsBinary: true, isLarge: true };
        }
        // Always read & keep editable, even if large (gist fallback will handle sharing)
        return { shouldRead: true, treatAsBinary: false, isLarge };
    }

    // Known binary extensions - treat as binary placeholders immediately.
    const BINARY_EXTENSIONS = new Set([
        'exe','dll','so','bin','dat','ico','png','jpg','jpeg','gif','wasm','class','jar','pdf','zip','tar','gz','tgz','7z','rar','mp3','mp4','mov','avi','ogg','woff','woff2','eot','otf','ttf','psd','blend','sqlite','db'
    ]);
    if (BINARY_EXTENSIONS.has(extension)) {
        return { shouldRead: false, treatAsBinary: true, isLarge };
    }

    // MIME type heuristics: if browser reports a text/ type, prefer reading it.
    if (file.type && file.type.startsWith('text/')) {
        if (file.size > ABSOLUTE_MAX_FILE_BYTES) return { shouldRead: false, treatAsBinary: true, isLarge: true };
        return { shouldRead: true, treatAsBinary: isLarge, isLarge };
    }

    // If MIME suggests image/audio/video/archive, treat as binary.
    if (file.type && /^(image|audio|video|application)\//.test(file.type) && !file.type.startsWith('text/')) {
        return { shouldRead: false, treatAsBinary: true, isLarge };
    }

    // Last-resort: sample the first few bytes to check magic numbers for common binaries.
    // Read small header (max 16 bytes).
    try {
        const headerBuf = await file.slice(0, 16).arrayBuffer();
        const header = new Uint8Array(headerBuf);
        // PNG: 89 50 4E 47
        if (header.length >= 4 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // JPG: FF D8 FF
        if (header.length >= 3 && header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // GIF: 'GIF8'
        if (header.length >= 4 && header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // PDF: '%PDF'
        if (header.length >= 4 && header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // PK (zip/jar): 'PK' 50 4B
        if (header.length >= 2 && header[0] === 0x50 && header[1] === 0x4B) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // ELF: 0x7f 'ELF'
        if (header.length >= 4 && header[0] === 0x7f && header[1] === 0x45 && header[2] === 0x4C && header[3] === 0x46) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // Windows PE (MZ): 'MZ'
        if (header.length >= 2 && header[0] === 0x4D && header[1] === 0x5A) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
        // WebAssembly: '\0asm'
        if (header.length >= 4 && header[0] === 0x00 && header[1] === 0x61 && header[2] === 0x73 && header[3] === 0x6D) {
            return { shouldRead: false, treatAsBinary: true, isLarge };
        }
    } catch (e) {
        // If header read fails silently, fall back to conservative behavior below.
    }

    // Default conservative: unknown extension -> treat as binary placeholder (non-editable)
    return { shouldRead: false, treatAsBinary: true, isLarge };
}

/**
 * Recursively traverses a file system entry (file or directory).
 * Uses the older but more compatible `webkitGetAsEntry` API.
 */
async function traverseFileTree(entry: any, path: string, tree: FileSystemTree): Promise<void> {
    const currentPath = path ? `${path}/${entry.name}` : entry.name;
    
        if (entry.isFile) {
                return new Promise((resolve, reject) => {
                                entry.file(async (file: File) => {
                                        try {
                                            const { shouldRead, treatAsBinary, isLarge } = await classifyFile(file);
                                            let content: string | undefined = undefined;
                                            if (shouldRead) {
                                                try { content = await file.text(); } catch { /* ignore read errors */ }
                                            }
                                            tree[currentPath] = {
                                                id: currentPath,
                                                name: entry.name,
                                                content,
                                                isBinary: treatAsBinary,
                                                originalSize: file.size,
                                                isLarge,
                                            };
                                        } finally {
                                            resolve();
                                        }
                                }, reject);
                });
        } else if (entry.isDirectory) {
        const dirId = `${currentPath}/`;
        const children: string[] = [];
        tree[dirId] = {
            id: dirId,
            name: entry.name,
            isBinary: false,
            children: children,
                        originalSize: 0,
        };
        
        const dirReader = entry.createReader();
        return new Promise((resolve, reject) => {
            dirReader.readEntries(async (entries: any[]) => {
                const childPromises = [];
                for (const childEntry of entries) {
                    const childId = `${dirId}${childEntry.name}${childEntry.isDirectory ? '/' : ''}`;
                    children.push(childId);
                    childPromises.push(traverseFileTree(childEntry, currentPath, tree));
                }
                await Promise.all(childPromises);
                resolve();
            }, reject);
        });
    }
}

/**
 * Main function to process items dropped onto the application.
 * It returns a complete FileSystemTree.
 */
export async function processDroppedFiles(items: DataTransferItemList): Promise<FileSystemTree> {
  const tree: FileSystemTree = {};
  const promises = [];

  for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry();
      if (entry) {
          promises.push(traverseFileTree(entry, '', tree));
      }
  }
  
    await Promise.all(promises);
    return tree;
}

/**
 * Normalize a deserialized/imported FileSystemTree (from share links / saved projects).
 * Some older or external sources may omit reliable `isBinary` flags. This function
 * inspects available metadata (name, content, originalSize) and applies conservative
 * heuristics to ensure binary files become non-editable placeholders.
 */
export function normalizeImportedTree(tree: FileSystemTree): FileSystemTree {
    const out: FileSystemTree = { ...tree };
    const BINARY_EXTENSIONS = new Set([
        'exe','dll','so','bin','dat','ico','png','jpg','jpeg','gif','wasm','class','jar','pdf','zip','tar','gz','tgz','7z','rar','mp3','mp4','mov','avi','ogg','woff','woff2','eot','otf','ttf','psd','blend','sqlite','db',
        'bmp','tiff','svgz','webp','flac','aac','m4a','wav','aiff','mid','midi','rmi','mpg','mpeg','mkv','webm','3gp','3g2','vob','mov','wmv','rm','ram','swf','fla','iso','img','dmg','cab','ar','rpm','deb','msi','apk','crx','xpi','dll','sys','drv','bak','tmp'
    ]);

    for (const id of Object.keys(out)) {
        const node = out[id];
        if (!node) continue;
        // Keep folders non-binary
        if (node.children) { node.isBinary = false; continue; }
        // If a producer already marked it binary, respect that
        if (node.isBinary) {
            // Remove any stored content for binary placeholders to keep UI consistent
            if (node.content !== undefined) delete node.content;
            continue;
        }
        // If node lacks content (common for placeholders / large binaries), mark binary
        if (node.content === undefined || node.content === null) {
            // If extension is known readable, keep editable placeholder (empty content) rather than binary.
            const extension = node.name.split('.').pop()?.toLowerCase() || '';
            if (READABLE_EXTENSIONS.has(extension)) { node.isBinary = false; node.content = node.content ?? ''; continue; }
            node.isBinary = true; continue;
        }
        // If original size exceeds absolute max, treat as binary
        if (node.originalSize && node.originalSize > ABSOLUTE_MAX_FILE_BYTES) {
            node.isBinary = true;
            if (node.content !== undefined) delete node.content;
            continue;
        }
        // Extension-based heuristics
        const extension = node.name.split('.').pop()?.toLowerCase() || '';
        // NEW: If extension is explicitly readable (e.g. txt, md, json, etc.),
        // skip ALL further binary heuristics (ratio, null bytes) to prevent
        // false positives on large Unicode-rich text files.
        if (READABLE_EXTENSIONS.has(extension)) {
            node.isBinary = false;
            continue;
        }
        if (BINARY_EXTENSIONS.has(extension) && !READABLE_EXTENSIONS.has(extension)) {
            node.isBinary = true;
            if (node.content !== undefined) delete node.content;
            continue;
        }
        // Content-based heuristics: look for null bytes or high ratio of non-printables
        const s = node.content || '';
        if (s.includes('\u0000')) { node.isBinary = true; if (node.content !== undefined) delete node.content; continue; }
        let nonPrintable = 0;
        for (let i = 0; i < s.length && i < 1024; i++) {
            const c = s.charCodeAt(i);
            if ((c < 32 && c !== 9 && c !== 10 && c !== 13) || c > 127) nonPrintable++;
        }
        if (s.length > 0) {
            const ratio = nonPrintable / Math.min(s.length, 1024);
            // Relax ratio threshold (raised from 5% to 25%) and only apply to unknown extensions
            if (ratio > 0.25) { node.isBinary = true; if (node.content !== undefined) delete node.content; continue; }
        }
        // Default: treat as text file
        node.isBinary = false;
    }
    return out;
}