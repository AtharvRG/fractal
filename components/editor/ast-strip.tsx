"use client";

import { useEditorStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { parseCode } from "@/lib/parser"; // <-- Import from our new, stable utility
import { extensionToLanguage } from '@/lib/language-map';
import { Loader2 } from "lucide-react";
import { AstNode } from "./ast-tree/ast-node";
import type { Tree } from '@/lib/types';
import type { IDisposable } from 'monaco-editor';

export default function AstStrip() { // <-- Note the 'export default'
  const { activeFileId, fileTree, editorInstance } = useEditorStore();
  const activeFile = activeFileId ? fileTree[activeFileId] : null;

  const [isParsing, setIsParsing] = useState(false);
  const [displayAst, setDisplayAst] = useState<Tree | null>(null);
  const [parserError, setParserError] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const processFile = async () => {
      setDisplayAst(null); // Clear previous AST immediately
      if (!activeFile || activeFile.isBinary || typeof activeFile.content !== 'string') {
        // No active text file
        return;
      }
      
  const extension = activeFile.name.split('.').pop()?.toLowerCase() || 'txt';
  const language = extensionToLanguage[extension as keyof typeof extensionToLanguage];

      if (!language) {
        return;
      }

      // Processing file
      setIsParsing(true);
      try {
        const tree = await parseCode(language, activeFile.content);
        if (!isCancelled) {
          setDisplayAst(tree);
          setParserError(null);
        }
      } catch (e) {
        if (!isCancelled) setParserError(String(e));
        if (!isCancelled) setDisplayAst(null);
      } finally {
        if (!isCancelled) setIsParsing(false);
      }
    };
    processFile();
    return () => { isCancelled = true; };
  }, [activeFile]);

  useEffect(() => {
    let cursorListener: IDisposable | undefined;
    if (editorInstance && displayAst?.rootNode) {
      cursorListener = editorInstance.onDidChangeCursorPosition(event => {
  try {
          const position = event.position;
          const point = { row: position.lineNumber - 1, column: position.column - 1 };
          
          if (displayAst.rootNode.descendantForPosition) {
            const descendant = displayAst.rootNode.descendantForPosition(point);
            if (descendant && descendant.id !== undefined) {
              setActiveNodeId(descendant.id);
            }
          }
        } catch (error) {
          // ignore cursor tracking errors
        }
      });
    }
    return () => { cursorListener?.dispose(); };
  }, [editorInstance, displayAst]);

  return (
    <div className="h-full bg-[#2c2a3b] p-3 overflow-y-auto font-sans">
      <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase mb-4">AST Explorer</h2>
      {isParsing ? (
        <div className="flex items-center justify-center h-full text-white/50">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Parsing...</span>
        </div>
      ) : displayAst?.rootNode ? (
        <div>
          <div className="text-xs text-white/60 mb-2">
            Tree ready: {displayAst.rootNode.type} ({displayAst.rootNode.namedChildren?.length || 0} children)
          </div>
          <AstNode node={displayAst.rootNode} activeNodeId={activeNodeId} />
          {parserError && (
            <div className="mt-2 text-xs text-red-400">Parser error: {parserError}</div>
          )}
        </div>
      ) : (
        <div className="text-sm text-white/40 text-center p-4">
          <p>Select a readable file (JS, TS, PY, GO) to see its structure.</p>
          <p className="text-xs mt-2">Active file: {activeFile?.name || 'none'}</p>
        </div>
      )}
    </div>
  );
}