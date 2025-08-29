"use client";

import { useEditorStore } from "@/lib/store";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import { loader, OnMount } from "@monaco-editor/react";
import { theme as fractalTheme } from "@/lib/monaco-theme";
import { initVimMode } from "monaco-vim";
import type { editor } from "monaco-editor";
import { CodeIdeStatusBar } from "./code-ide-status-bar";
import { EditorTabs } from "./editor-tabs";

loader.init().then((monaco) => {
  monaco.editor.defineTheme('FractalOneDark', fractalTheme);
});

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50 bg-[#282634]">Loading Editor...</div>,
});

export function CodeIdeStrip() {
  const store = useEditorStore();
  const activeFile = store.getActiveFile();
  const [language, setLanguage] = useState('plaintext');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const vimModeRef = useRef<any>(null);
  
  // Use a ref to track the previous file ID to correctly save its state
  const previousFileIdRef = useRef<string | null>(null);
  useEffect(() => {
    previousFileIdRef.current = store.activeFileId;
  }, [store.activeFileId]);

  useEffect(() => {
    // This is the cleanup function that runs BEFORE the component re-renders for a new file.
    // This is where we save the state of the file we are switching AWAY from.
    return () => {
      if (editorRef.current && previousFileIdRef.current) {
        const viewState = editorRef.current.saveViewState();
        const content = editorRef.current.getValue();
        // Call the action to save both content and view state for the PREVIOUS file.
        useEditorStore.getState().updateFileContent(previousFileIdRef.current, content, viewState);
      }
    };
  }, []); // Run only on mount and unmount of the entire strip

  useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      const extension = activeFile.name.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'js': case 'jsx': setLanguage('javascript'); break;
        case 'ts': case 'tsx': setLanguage('typescript'); break;
        case 'py': setLanguage('python'); break;
        case 'go': setLanguage('go'); break;
        case 'json': setLanguage('json'); break;
        case 'md': setLanguage('markdown'); break;
        default: setLanguage('plaintext');
      }
    } else {
      setLanguage('plaintext');
    }
  }, [activeFile]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    store.setEditorInstance(editor);
    
    if (activeFile?.viewState) {
      editor.restoreViewState(activeFile.viewState);
    }
    // (Re)initialize Vim mode cleanly to avoid duplicate instances/status lines
    if (store.vimMode && typeof document !== 'undefined') {
      if (vimModeRef.current) {
        try { vimModeRef.current.dispose(); } catch {}
      }
      vimModeRef.current = initVimMode(
        editor,
        document.querySelector<HTMLDivElement>(".monaco-status-bar") || undefined
      );
    }
  };
  
  const handleContentChange = useCallback((value: string | undefined) => {
    if (activeFile && typeof value === 'string' && activeFile.content !== value) {
      // Direct store call to save content and mark as dirty.
      useEditorStore.getState().updateFileContent(activeFile.id, value, editorRef.current?.saveViewState() || null);
    }
  }, [activeFile]);

  useEffect(() => {
    if (editorRef.current && typeof document !== 'undefined') {
      if (store.vimMode && !vimModeRef.current) {
        // Initialize fresh
        vimModeRef.current = initVimMode(
          editorRef.current,
          document.querySelector<HTMLDivElement>(".monaco-status-bar") || undefined
        );
      } else if (!store.vimMode && vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    }
  }, [store.vimMode]);

  // Dispose Vim instance on unmount to prevent lingering key handlers
  useEffect(() => {
    return () => {
      if (vimModeRef.current) {
        try { vimModeRef.current.dispose(); } catch {}
        vimModeRef.current = null;
      }
    };
  }, []);

  const welcomeMessage = `// Welcome to Fractal!\n// Select a file from the explorer to begin.`;
  const value = activeFile ? (activeFile.isBinary ? `// Binary file` : activeFile.content || '') : '';

  return (
    <div className="h-full w-full flex flex-col bg-[#282634] min-h-0">
      <EditorTabs />
      <div className="flex-grow relative min-h-0">
        {activeFile ? (
          <MonacoEditor
            key={activeFile.id}
            height="100%"
            language={language}
            defaultValue={value}
            theme="FractalOneDark"
            onMount={handleEditorMount}
            onChange={handleContentChange}
            options={{
              readOnly: activeFile.isBinary,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "var(--font-jetbrains-mono)",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: false,
              renderLineHighlight: "gutter",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              // semantic highlighting is automatically enabled in Monaco 0.33+ when theme provides semantic tokens
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/40 font-sans p-8 text-center">{welcomeMessage}</div>
        )}
        <div className="monaco-status-bar absolute bottom-0 right-2 text-xs text-white/50" />
      </div>
      <CodeIdeStatusBar />
    </div>
  );
}