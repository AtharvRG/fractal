// Central mapping from file extensions to tree-sitter language keys.
// Update this file when enabling new languages. The parser expects
// wasm files at `/parsers/tree-sitter-<lang>.wasm` by convention.

export const extensionToLanguage: Record<string, string> = {
  // JavaScript / TypeScript
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',

  // Python
  py: 'python',

  // Go
  go: 'go',

  // Web / markup
  html: 'html',
  htm: 'html',
  css: 'css',

  // Data formats
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',

  // Systems / scripting
  sh: 'bash',
  bash: 'bash',

  // Compiled languages
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  java: 'java',

  // Other
  rb: 'ruby',
  php: 'php',
  md: 'markdown',
  lua: 'lua',
};

export const supportedLanguages = Array.from(new Set(Object.values(extensionToLanguage))).sort();
