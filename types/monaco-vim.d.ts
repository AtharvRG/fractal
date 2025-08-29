declare module 'monaco-vim' {
  import type { editor } from 'monaco-editor';
  interface VimMode {
    dispose(): void;
  }
  export function initVimMode(editor: editor.IStandaloneCodeEditor, statusBar?: HTMLElement | null): VimMode;
}
