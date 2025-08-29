import type { editor } from 'monaco-editor';

// Represents a single file or folder in our virtual file system
export type FileSystemNode = {
  id: string;
  name: string;
  content?: string;
  isBinary: boolean;
  children?: string[];
  viewState?: editor.ICodeEditorViewState | null;
  /** Original byte size of the file on import (if a file). */
  originalSize?: number;
  /** True if file exceeded the in-app editable size threshold when imported. */
  isLarge?: boolean;
};

// A map of node IDs to the actual node objects
export type FileSystemTree = Record<string, FileSystemNode>;

// The Tree type is now 'any' to match the output of your working parseCode function
export type Tree = any;