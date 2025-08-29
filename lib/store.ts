import { create } from 'zustand';
import { showAlert } from '@/lib/dialog-store';
import { FileSystemNode, FileSystemTree, Tree } from './types';
import type { editor } from 'monaco-editor';

interface ClipboardState { nodes: FileSystemTree; isCut: boolean; }

interface EditorState {
  fileTree: FileSystemTree;
  activeFileId: string | null;
  openFileIds: string[];
  dirtyFileIds: Set<string>;
  ast: Tree | null; // This is now 'any'
  isParsing: boolean;
  clipboard: ClipboardState | null;
  vimMode: boolean;
  editorInstance: editor.IStandaloneCodeEditor | null;
  setEditorInstance: (instance: editor.IStandaloneCodeEditor | null) => void;
  setFileTree: (fileTree: FileSystemTree) => void;
  setActiveFileId: (id: string | null) => void;
  closeFile: (id: string) => void;
  getActiveFile: () => FileSystemNode | null;
  setAst: (ast: Tree | null) => void;
  setIsParsing: (isParsing: boolean) => void;
  // ... all other actions remain the same
  toggleVimMode: () => void;
  updateFileContent: (fileId: string, content: string, viewState: editor.ICodeEditorViewState | null) => void;
  addNode: (name: string, type: 'file' | 'folder' | 'binary', parentId: string) => void;
  deleteNode: (nodeId: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  moveNode: (draggedId: string, targetFolderId: string | null) => void;
  copyNodes: (nodeIds: Set<string>) => void;
  cutNodes: (nodeIds: Set<string>) => void;
  pasteNodes: (targetParentId: string) => void;
  clearSession: () => void;
}

// ... (The rest of the store implementation is unchanged as its logic is correct)
const getParentId = (nodeId: string): string => {
  if (!nodeId.includes('/')) return '';
  const parts = nodeId.endsWith('/') ? nodeId.slice(0, -1).split('/') : nodeId.split('/');
  parts.pop();
  if (parts.length === 0) return '';
  return parts.join('/') + '/';
};

export const useEditorStore = create<EditorState>((set, get) => ({
  fileTree: {}, activeFileId: null, openFileIds: [], dirtyFileIds: new Set(), ast: null, isParsing: false, clipboard: null, vimMode: false, editorInstance: null,
  setEditorInstance: (instance) => set({ editorInstance: instance }),
  setFileTree: (fileTree) => set({ fileTree, activeFileId: null, ast: null, openFileIds: [], dirtyFileIds: new Set() }),
  setActiveFileId: (id) => {
    if (!id) { set({ activeFileId: null }); return; }
    const { openFileIds, dirtyFileIds } = get();
    const isAlreadyOpen = openFileIds.includes(id);
    const newDirtyFileIds = new Set(dirtyFileIds); newDirtyFileIds.delete(id);
    set({ activeFileId: id, ast: null, openFileIds: isAlreadyOpen ? openFileIds : [...openFileIds, id], dirtyFileIds: newDirtyFileIds });
  },
  closeFile: (id) => set(state => {
    const newOpenFileIds = state.openFileIds.filter(fileId => fileId !== id);
    const newDirtyFileIds = new Set(state.dirtyFileIds); newDirtyFileIds.delete(id);
    let newActiveFileId = state.activeFileId;
    if (state.activeFileId === id) {
      const closedTabIndex = state.openFileIds.indexOf(id);
      if (newOpenFileIds.length > 0) { newActiveFileId = newOpenFileIds[Math.max(0, closedTabIndex - 1)]; } else { newActiveFileId = null; }
    }
    return { openFileIds: newOpenFileIds, activeFileId: newActiveFileId, dirtyFileIds: newDirtyFileIds };
  }),
  getActiveFile: () => { const { fileTree, activeFileId } = get(); return activeFileId ? fileTree[activeFileId] : null; },
  setAst: (ast) => set({ ast }),
  setIsParsing: (isParsing) => set({ isParsing }),
  toggleVimMode: () => set((state) => ({ vimMode: !state.vimMode })),
  updateFileContent: (fileId, content, viewState) => set(state => {
    const file = state.fileTree[fileId];
    if (file && !file.isBinary && file.content !== content) { const newTree = { ...state.fileTree, [fileId]: { ...file, content, viewState } }; const newDirtyFileIds = new Set(state.dirtyFileIds); newDirtyFileIds.add(fileId); return { fileTree: newTree, dirtyFileIds: newDirtyFileIds }; }
    if (file && !file.isBinary && file.viewState !== viewState) { const newTree = { ...state.fileTree, [fileId]: { ...file, viewState } }; return { fileTree: newTree }; }
    return state;
  }),
  addNode: (name, type, parentId) => set((state) => {
    const newTree = { ...state.fileTree };
    // If user requested a normal 'file' but the extension is a known binary
    // extension, force it to be created as a binary placeholder.
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const BINARY_EXTENSIONS = new Set([
      'exe','dll','so','bin','dat','ico','png','jpg','jpeg','gif','wasm','class','jar','pdf','zip','tar','gz','tgz','7z','rar','mp3','mp4','mov','avi','ogg','woff','woff2','eot','otf','ttf','psd','blend','sqlite','db','bmp','tiff','svg','webp','flac','aac','m4a','wav','aiff','mid','midi','rmi','mpg','mpeg','mkv','webm','3gp','3g2','vob','wmv','rm','ram','swf','fla','iso','img','dmg','cab','ar','rpm','deb','msi','apk','crx','xpi','sys','drv','bak','tmp'
    ]);
    if (type === 'file' && BINARY_EXTENSIONS.has(ext)) {
      type = 'binary';
    }

    let newId = parentId ? `${parentId}${name}` : name;
    if (type === 'folder') newId += '/';
  if (newTree[newId]) { showAlert('An item with this name already exists here.', 'Name Conflict'); return state; }
    const newNode: FileSystemNode = { id: newId, name, isBinary: type === 'binary', content: type === 'file' ? '' : undefined, children: type === 'folder' ? [] : undefined, viewState: null };
    newTree[newId] = newNode;
    if (parentId && newTree[parentId]?.children) { newTree[parentId].children!.push(newId); newTree[parentId].children!.sort((a,b) => (a.endsWith('/') === b.endsWith('/')) ? a.localeCompare(b) : (a.endsWith('/') ? -1 : 1)); }
    return { fileTree: newTree };
  }),
  deleteNode: (nodeId) => set((state) => {
    const newTree = { ...state.fileTree };
    const nodesToDelete = new Set<string>([nodeId]);
    if (nodeId.endsWith('/')) { const findChildren = (id: string) => { newTree[id]?.children?.forEach(childId => { nodesToDelete.add(childId); if (childId.endsWith('/')) findChildren(childId); }); }; findChildren(nodeId); }
    nodesToDelete.forEach(id => delete newTree[id]);
    const parentId = getParentId(nodeId);
    if (parentId && newTree[parentId]?.children) { newTree[parentId].children = newTree[parentId].children!.filter(id => id !== nodeId); }
    const newOpenFileIds = state.openFileIds.filter(id => !nodesToDelete.has(id));
    const newDirtyFileIds = new Set(state.dirtyFileIds); nodesToDelete.forEach(id => newDirtyFileIds.delete(id));
    let newActiveFileId = state.activeFileId;
    if (nodesToDelete.has(state.activeFileId || '')) {
      const closedTabIndex = state.openFileIds.indexOf(state.activeFileId!);
      if (newOpenFileIds.length > 0) { newActiveFileId = newOpenFileIds[Math.max(0, closedTabIndex - 1)] || newOpenFileIds[0]; } else { newActiveFileId = null; }
    }
    return { fileTree: newTree, openFileIds: newOpenFileIds, dirtyFileIds: newDirtyFileIds, activeFileId: newActiveFileId, ast: newActiveFileId === state.activeFileId ? state.ast : null };
  }),
  renameNode: (nodeId, newName) => set(state => {
    const newTree = { ...state.fileTree }; const parentId = getParentId(nodeId);
    const newId = `${parentId}${newName}${nodeId.endsWith('/') ? '/' : ''}`;
  if (newTree[newId]) { showAlert('An item with this name already exists.', 'Name Conflict'); return state; }
    const nodesToUpdate = new Map<string, FileSystemNode>(); const nodesToDelete: string[] = [];
    const updateRecursively = (currentId: string) => { const node = newTree[currentId]; if (!node) return; const updatedId = currentId.replace(nodeId, newId); const updatedNode: FileSystemNode = { ...node, id: updatedId, children: node.children?.map(c => c.replace(nodeId, newId)) }; if (currentId === nodeId) updatedNode.name = newName; nodesToUpdate.set(updatedId, updatedNode); nodesToDelete.push(currentId); node.children?.forEach(updateRecursively); };
    updateRecursively(nodeId);
    nodesToDelete.forEach(id => delete newTree[id]);
    nodesToUpdate.forEach((node, id) => newTree[id] = node);
    if (parentId && newTree[parentId]?.children) { newTree[parentId].children = newTree[parentId].children!.map(id => id === nodeId ? newId : id).sort((a,b) => (a.endsWith('/') === b.endsWith('/')) ? a.localeCompare(b) : (a.endsWith('/') ? -1 : 1)); }
    const newOpenFileIds = state.openFileIds.map(id => id.startsWith(nodeId) ? id.replace(nodeId, newId) : id);
    const newActiveFileId = state.activeFileId?.startsWith(nodeId) ? state.activeFileId.replace(nodeId, newId) : state.activeFileId;
    const newDirtyFileIds = new Set(Array.from(state.dirtyFileIds).map(id => id.startsWith(nodeId) ? id.replace(nodeId, newId) : id));
    return { fileTree: newTree, openFileIds: newOpenFileIds, activeFileId: newActiveFileId, dirtyFileIds: newDirtyFileIds };
  }),
  moveNode: (draggedId, targetFolderId) => set(state => {
    const newTree = { ...state.fileTree }; const draggedNode = newTree[draggedId];
    if (!draggedNode || draggedId === targetFolderId || (targetFolderId && draggedId.startsWith(targetFolderId))) return state;
    const oldParentId = getParentId(draggedId); const newParentId = targetFolderId || '';
    const newId = `${newParentId}${draggedNode.name}${draggedId.endsWith('/') ? '/' : ''}`;
  if (newTree[newId]) { showAlert('An item with this name already exists in the target folder.', 'Name Conflict'); return state; }
    const nodesToUpdate = new Map<string, FileSystemNode>(); const nodesToDelete: string[] = [];
    const updateRecursively = (currentId: string) => { const node = newTree[currentId]; if (!node) return; const updatedId = currentId.replace(draggedId, newId); const updatedNode: FileSystemNode = { ...node, id: updatedId, children: node.children?.map(c => c.replace(draggedId, newId)) }; nodesToUpdate.set(updatedId, updatedNode); nodesToDelete.push(currentId); node.children?.forEach(updateRecursively); };
    updateRecursively(draggedId);
    nodesToDelete.forEach(id => delete newTree[id]);
    nodesToUpdate.forEach((node, id) => newTree[id] = node);
    if (oldParentId && newTree[oldParentId]?.children) { newTree[oldParentId].children = newTree[oldParentId].children!.filter(id => id !== draggedId); }
    if (newParentId && newTree[newParentId]?.children) { newTree[newParentId].children!.push(newId); newTree[newParentId].children!.sort((a,b) => (a.endsWith('/') === b.endsWith('/')) ? a.localeCompare(b) : (a.endsWith('/') ? -1 : 1)); }
    const newOpenFileIds = state.openFileIds.map(id => id.startsWith(draggedId) ? id.replace(draggedId, newId) : id);
    const newActiveFileId = state.activeFileId?.startsWith(draggedId) ? state.activeFileId.replace(draggedId, newId) : state.activeFileId;
    const newDirtyFileIds = new Set(Array.from(state.dirtyFileIds).map(id => id.startsWith(draggedId) ? id.replace(draggedId, newId) : id));
    return { fileTree: newTree, openFileIds: newOpenFileIds, activeFileId: newActiveFileId, dirtyFileIds: newDirtyFileIds };
  }),
  copyNodes: (nodeIds) => { const { fileTree } = get(); const clipboardTree: FileSystemTree = {}; nodeIds.forEach(id => { const node = fileTree[id]; if (node) clipboardTree[id] = { ...node }; }); set({ clipboard: { nodes: clipboardTree, isCut: false } }); },
  cutNodes: (nodeIds) => { const { fileTree } = get(); const clipboardTree: FileSystemTree = {}; nodeIds.forEach(id => { const node = fileTree[id]; if (node) clipboardTree[id] = { ...node }; }); set({ clipboard: { nodes: clipboardTree, isCut: true } }); },
  pasteNodes: (targetParentId) => set(state => {
    if (!state.clipboard) return state;
    const newTree = { ...state.fileTree }; const clipboard = { ...state.clipboard };
  for (const oldId in clipboard.nodes) { const nodeToPaste = clipboard.nodes[oldId]; const newId = `${targetParentId}${nodeToPaste.name}${oldId.endsWith('/') ? '/' : ''}`; if (newTree[newId]) { showAlert(`An item named '${nodeToPaste.name}' already exists.`, 'Duplicate'); continue; } const newNode: FileSystemNode = { ...nodeToPaste, id: newId }; newTree[newId] = newNode; if (targetParentId && newTree[targetParentId]?.children) { newTree[targetParentId].children!.push(newId); } if (clipboard.isCut) { delete newTree[oldId]; const oldParentId = getParentId(oldId); if (oldParentId && newTree[oldParentId]?.children) { newTree[oldParentId].children = newTree[oldParentId].children!.filter(id => id !== oldId); } } }
    const newClipboard = clipboard.isCut ? null : state.clipboard;
    return { fileTree: newTree, clipboard: newClipboard };
  }),
  clearSession: () => {
    set({ fileTree: {}, activeFileId: null, openFileIds: [], dirtyFileIds: new Set(), ast: null, clipboard: null });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fractal:lastProject');
    }
    // Remove hash without reloading
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#h:')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}));