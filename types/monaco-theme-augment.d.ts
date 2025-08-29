import 'monaco-editor';
import type { editor } from 'monaco-editor';

declare module 'monaco-editor' {
  namespace editor {
    interface IStandaloneThemeData {
      semanticTokenColors?: { [selector: string]: string };
    }
  }
}
