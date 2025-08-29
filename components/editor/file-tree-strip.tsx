"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileTreeToolbar } from "./file-tree/file-tree-toolbar";
import { FileTreeNode } from "./file-tree/file-tree-node";
import { useEditorStore } from "@/lib/store";
import { processDroppedFiles } from "@/lib/file-utils";
import { Loader2 } from "lucide-react";
import { showConfirm, showAlert } from '@/lib/dialog-store';
import { ContextMenu } from "./file-tree/context-menu";
import { CreationInput } from "./file-tree/creation-input";

type CreationType = 'file' | 'folder' | 'binary';
interface ContextMenuState { x: number; y: number; nodeId: string; }
interface CreationState { type: CreationType; parentId: string; }

const getParentId = (nodeId: string): string => {
  if (!nodeId.includes('/')) return '';
  const parts = nodeId.endsWith('/') ? nodeId.slice(0, -1).split('/') : nodeId.split('/');
  parts.pop();
  if (parts.length === 0) return '';
  return parts.join('/') + '/';
};

export function FileTreeStrip() {
  const store = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [creationState, setCreationState] = useState<CreationState | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [forceOpen, setForceOpen] = useState<Set<string>>(new Set());
  const [visibleNodes, setVisibleNodes] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const generateVisibleNodes = useCallback(() => {
    const list: string[] = [];
    const rootNodes = Object.keys(store.fileTree)
      .filter(id => !id.includes('/') || (id.endsWith('/') && id.split('/').filter(Boolean).length === 1))
      .sort((a,b) => (a.endsWith('/') === b.endsWith('/')) ? a.localeCompare(b) : (a.endsWith('/') ? -1 : 1));
    function traverse(nodeId: string) {
      list.push(nodeId);
      const node = store.fileTree[nodeId];
      if (node?.children && (expandedFolders.has(nodeId) || forceOpen.has(nodeId))) {
        node.children.forEach(traverse);
      }
    }
    rootNodes.forEach(traverse);
    return list;
  }, [store.fileTree, expandedFolders, forceOpen]);

  useEffect(() => { setVisibleNodes(generateVisibleNodes()); }, [generateVisibleNodes]);

  const handleSelection = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    if (isShift && lastSelectedId) {
      const lastIdx = visibleNodes.indexOf(lastSelectedId);
      const currentIdx = visibleNodes.indexOf(nodeId);
      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      setSelectedNodeIds(new Set(visibleNodes.slice(start, end + 1)));
    } else if (isCtrlOrCmd) {
      setSelectedNodeIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) { next.delete(nodeId); } else { next.add(nodeId); }
        return next;
      });
      setLastSelectedId(nodeId);
    } else {
      setSelectedNodeIds(new Set([nodeId]));
      setLastSelectedId(nodeId);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (renamingNodeId || creationState) return;
    const leadSelectionId = lastSelectedId || (selectedNodeIds.size > 0 ? Array.from(selectedNodeIds)[0] : null);
    const currentIndex = leadSelectionId ? visibleNodes.indexOf(leadSelectionId) : -1;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); if (currentIndex > 0) { const nextId = visibleNodes[currentIndex - 1]; setSelectedNodeIds(new Set([nextId])); setLastSelectedId(nextId); } break;
      case 'ArrowDown': e.preventDefault(); if (currentIndex < visibleNodes.length - 1) { const nextId = visibleNodes[currentIndex + 1]; setSelectedNodeIds(new Set([nextId])); setLastSelectedId(nextId); } break;
      case 'Delete': if (selectedNodeIds.size > 0) { e.preventDefault(); showConfirm(`Delete ${selectedNodeIds.size} item(s)?`, 'Confirm Delete').then(ok => { if (ok) { selectedNodeIds.forEach(id => store.deleteNode(id)); setSelectedNodeIds(new Set()); setLastSelectedId(null); } }); } break;
      case 'F2': if(selectedNodeIds.size === 1) { e.preventDefault(); const idToRename = Array.from(selectedNodeIds)[0]; setRenamingNodeId(idToRename); } break;
    }
  }, [renamingNodeId, creationState, lastSelectedId, selectedNodeIds, visibleNodes, store]);

  useEffect(() => { document.body.addEventListener('keydown', handleKeyDown); return () => document.body.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);
  
  const handleDropOnStrip = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.items.length > 0) {
      setIsLoading(true);
  try { store.setFileTree(await processDroppedFiles(e.dataTransfer.items)); } catch (error) { /* silent in UI */ } finally { setIsLoading(false); }
    } else { const draggedId = e.dataTransfer.getData("text/plain"); if (draggedId) store.moveNode(draggedId, null); }
  };
  
  const handleDropOnNode = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault(); e.stopPropagation();
    const draggedId = e.dataTransfer.getData("text/plain"); if (draggedId) store.moveNode(draggedId, targetFolderId);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedNodeIds.has(nodeId)) { setSelectedNodeIds(new Set([nodeId])); setLastSelectedId(nodeId); }
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  const closeContextMenu = () => setContextMenu(null);

  const startCreation = (type: CreationType, parentId: string) => {
    closeContextMenu();
    if (parentId) { setForceOpen(prev => new Set(prev).add(parentId)); setExpandedFolders(prev => new Set(prev).add(parentId)); }
    setCreationState({ type, parentId });
  };
  
  const handleToolbarAdd = (type: CreationType) => {
    let parentId = '';
    // CRITICAL FIX: Check if the last selected node still exists in the fileTree before using it.
    if (lastSelectedId && store.fileTree[lastSelectedId]) {
      const selectedNode = store.fileTree[lastSelectedId];
      parentId = selectedNode.children !== undefined ? selectedNode.id : getParentId(selectedNode.id);
    } else if (!lastSelectedId && selectedNodeIds.size > 0) {
        // Fallback if lastSelectedId is out of sync
        const firstSelected = Array.from(selectedNodeIds)[0];
        if(store.fileTree[firstSelected]) {
            const selectedNode = store.fileTree[firstSelected];
            parentId = selectedNode.children !== undefined ? selectedNode.id : getParentId(selectedNode.id);
        }
    }
    startCreation(type, parentId);
  };

  const submitCreation = (name: string) => {
    if (creationState) {
  if (/[/\\]/.test(name)) { showAlert('Names cannot contain slashes.', 'Invalid Name'); return; }
      store.addNode(name, creationState.type, creationState.parentId);
      setCreationState(null);
    }
  };

  const startRename = (nodeId: string) => { closeContextMenu(); setRenamingNodeId(nodeId); };
  const finishRename = (newName: string) => { if (renamingNodeId) store.renameNode(renamingNodeId, newName); setRenamingNodeId(null); };

  const rootNodes = Object.keys(store.fileTree)
    .filter(id => !id.includes('/') || (id.endsWith('/') && id.split('/').filter(Boolean).length === 1))
    .sort((a,b) => (a.endsWith('/') === b.endsWith('/')) ? a.localeCompare(b) : (a.endsWith('/') ? -1 : 1));

  return (
    <div className="h-full flex flex-col bg-[#2c2a3b] relative focus:outline-none" onClick={() => { closeContextMenu(); setSelectedNodeIds(new Set()); setLastSelectedId(null); }} onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnStrip}>
      {isLoading && <div className="absolute inset-0 bg-[#2c2a3b]/80 z-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-aquamarine"/></div>}
      <FileTreeToolbar onAdd={handleToolbarAdd} />
      <div className="flex-grow p-2 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {creationState && creationState.parentId === '' && <CreationInput type={creationState.type} onSubmit={submitCreation} onCancel={() => setCreationState(null)} />}
        {rootNodes.map((id) => (
          <FileTreeNode key={id} nodeId={id} renamingNodeId={renamingNodeId} creationState={creationState}
            selectedNodeIds={selectedNodeIds} expandedFolders={expandedFolders} setExpandedFolders={setExpandedFolders}
            onSelect={handleSelection} onContextMenu={handleContextMenu} onStartRename={startRename} onFinishRename={finishRename}
            onCancelRename={() => setRenamingNodeId(null)} onDrop={handleDropOnNode}
            onSubmitCreation={submitCreation} onCancelCreation={() => setCreationState(null)}
          />
        ))}
      </div>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId}
          isFolder={contextMenu.nodeId.endsWith('/')} canPaste={!!store.clipboard}
          onClose={closeContextMenu}
          onCut={() => { store.cutNodes(selectedNodeIds); closeContextMenu(); }}
          onCopy={() => { store.copyNodes(selectedNodeIds); closeContextMenu(); }}
          onPaste={() => { store.pasteNodes(contextMenu.nodeId.endsWith('/') ? contextMenu.nodeId : getParentId(contextMenu.nodeId)); closeContextMenu(); }}
          onDelete={() => { showConfirm(`Delete ${selectedNodeIds.size} item(s)?`, 'Confirm Delete').then(ok => { if (ok) { selectedNodeIds.forEach(id => store.deleteNode(id)); } closeContextMenu(); }); }}
          onRename={() => startRename(contextMenu.nodeId)}
          onAddFile={() => startCreation('file', contextMenu.nodeId)}
          onAddFolder={() => startCreation('folder', contextMenu.nodeId)}
        />
      )}
    </div>
  );
}