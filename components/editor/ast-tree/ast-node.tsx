"use client";

import { useEditorStore } from "@/lib/store";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface AstNodeProps {
  node: any; // Use 'any' as the type is now dynamic from the untyped parser output
  activeNodeId: number | null;
  level?: number;
}

export function AstNode({ node, activeNodeId, level = 0 }: AstNodeProps) {
  // Hooks must be declared before any potential early return to satisfy rules-of-hooks
  const editorInstance = useEditorStore((state) => state.editorInstance);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(level < 3);
  const hasNode = !!node;
  const children = hasNode ? (node.namedChildren || []) : [];
  const hasChildren = children.length > 0;
  const isLeaf = hasNode && !hasChildren && node.text && node.text.trim().length > 0;
  const isActive = hasNode && node.id === activeNodeId;

  useEffect(() => {
  if (isActive && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isActive]);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  if (editorInstance && hasNode && node.startPosition && node.endPosition) {
      try {
        const { startPosition, endPosition } = node;
        const selection = {
          startLineNumber: startPosition.row + 1,
          startColumn: startPosition.column + 1,
          endLineNumber: endPosition.row + 1,
          endColumn: endPosition.column + 1,
        };
        editorInstance.revealRangeInCenterIfOutsideViewport(selection, 0);
        editorInstance.setSelection(selection);
        editorInstance.focus();
      } catch (err) {
        // ignore
      }
    }
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div ref={nodeRef} style={{ paddingLeft: `${level * 12}px` }}>
      <div
        className={`flex items-center text-sm cursor-pointer py-0.5 group rounded-sm transition-colors ${
          isActive ? 'bg-aquamarine/30' : 'hover:bg-white/5'
        }`}
        onClick={handleNodeClick}
      >
        <div onClick={toggleOpen} className="p-0.5 rounded hover:bg-white/10">
          {hasChildren ? ( isOpen ? <ChevronDown /> : <ChevronRight /> ) : <div className="w-4" />}
        </div>
        <span className={`ml-1 ${isActive ? 'text-aquamarine font-bold' : 'text-purple-400 group-hover:text-purple-300'}`}>
      {hasNode ? (node.type || 'unknown') : 'unknown'}
        </span>
        {isLeaf && (
          <span className="ml-2 text-aquamarine/80 truncate">
            “{node.text && node.text.length > 40 ? `${node.text.substring(0, 40)}...` : node.text || ''}”
          </span>
        )}
      </div>
    {hasNode && hasChildren && isOpen && (
        <div>{children.map((childNode: any, index: number) => (<AstNode key={index} node={childNode} level={level + 1} activeNodeId={activeNodeId} />))}</div>
      )}
    </div>
  );
}