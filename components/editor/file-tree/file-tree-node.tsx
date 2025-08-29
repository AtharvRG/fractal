"use client";

import { useEditorStore } from "@/lib/store";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { FileIcon } from "./file-icon";
import { RenameInput } from "./rename-input";
import { CreationInput } from "./creation-input";

type CreationType = 'file' | 'folder' | 'binary';

interface FileTreeNodeProps {
  nodeId: string;
  renamingNodeId: string | null;
  creationState: { type: CreationType; parentId: string } | null;
  selectedNodeIds: Set<string>;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSelect: (nodeId: string, event: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onStartRename: (nodeId: string) => void;
  onFinishRename: (newName: string) => void;
  onCancelRename: () => void;
  onDrop: (e: React.DragEvent, targetFolderId: string) => void;
  onSubmitCreation: (name: string) => void;
  onCancelCreation: () => void;
}

export function FileTreeNode({ nodeId, renamingNodeId, creationState, selectedNodeIds, expandedFolders, setExpandedFolders, onSelect, ...props }: FileTreeNodeProps) {
  const store = useEditorStore();
  const node = store.fileTree[nodeId];
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const isFolder = node?.children !== undefined;
  const level = node ? node.id.split('/').filter(Boolean).length - 1 : 0;
  const isOpen = isFolder && expandedFolders.has(nodeId);
  const isSelected = selectedNodeIds.has(nodeId);
  const isDirty = store.dirtyFileIds.has(nodeId);

  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  if (!node) return null;

  const isRenaming = renamingNodeId === nodeId;
  const isCreating = creationState?.parentId === nodeId;

  const handleClick = (e: React.MouseEvent) => {
    onSelect(node.id, e);
    if (isFolder) {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setExpandedFolders(prev => {
          const next = new Set(prev);
          if (next.has(nodeId)) next.delete(nodeId);
          else next.add(nodeId);
          return next;
        });
      }
    } else {
      store.setActiveFileId(node.id);
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation(); e.dataTransfer.setData("text/plain", nodeId); e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    props.onDrop(e, isFolder ? nodeId : getParentId(nodeId));
  };
  const getParentId = (id: string) => id.substring(0, id.lastIndexOf('/') + 1);

  return (
    <div ref={nodeRef}>
      <div style={{ paddingLeft: `${level * 12 + 4}px` }} onContextMenu={(e) => props.onContextMenu(e, nodeId)} onDragOver={handleDragOver} onDrop={handleDrop}>
        {isRenaming ? (
          <RenameInput originalName={node.name} isFolder={isFolder} isBinary={node.isBinary} onSubmit={props.onFinishRename} onCancel={props.onCancelRename} />
        ) : (
          <div
            className={`flex items-center p-1 rounded transition-colors group ${
              isSelected ? "bg-aquamarine/30 text-white" : "hover:bg-white/10 text-white/80"
            }`}
            onClick={handleClick} onDoubleClick={() => props.onStartRename(nodeId)} title={node.name}
            draggable="true" onDragStart={handleDragStart}
          >
            {isFolder ? (isOpen ? <ChevronDown className="w-4 h-4 mr-1"/> : <ChevronRight className="w-4 h-4 mr-1"/>) : <div className="w-4 mr-1"/>}
            <FileIcon isBinary={node.isBinary} isFolder={isFolder} fileName={node.name} />
            <span className={`ml-2 text-sm truncate font-sans ${isDirty ? 'italic' : ''}`}>{node.name}</span>
          </div>
        )}
      </div>
      {isFolder && isOpen && (
        <div>
          {isCreating && ( <div style={{ paddingLeft: `${(level + 1) * 12 + 4}px` }}><CreationInput type={creationState!.type} onSubmit={props.onSubmitCreation} onCancel={props.onCancelCreation} /></div> )}
          {node.children?.map((childId) => (
            <FileTreeNode key={childId} nodeId={childId} renamingNodeId={renamingNodeId} creationState={creationState} onSelect={onSelect} expandedFolders={expandedFolders} setExpandedFolders={setExpandedFolders} selectedNodeIds={selectedNodeIds} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}