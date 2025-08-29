import { Trash2, Edit, FilePlus, FolderPlus, Clipboard, ClipboardCopy, ClipboardPaste } from "lucide-react";

interface ContextMenuProps {
  x: number; y: number; nodeId: string; isFolder: boolean; canPaste: boolean;
  onClose: () => void;
  onDelete: () => void;
  onRename: () => void;
  onAddFile: () => void;
  onAddFolder: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function ContextMenu({ x, y, isFolder, canPaste, onClose, onDelete, onRename, onAddFile, onAddFolder, onCut, onCopy, onPaste }: ContextMenuProps) {
  return (
    <div
      className="fixed z-50 bg-[#3a384b] rounded-md shadow-lg border border-white/10 p-1 font-sans text-sm"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      {isFolder && (
        <>
          <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80" onClick={onAddFile}>
            <FilePlus className="w-4 h-4 mr-2" /> New File
          </button>
          <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80" onClick={onAddFolder}>
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
          </button>
          <div className="h-px bg-white/10 my-1" />
        </>
      )}
      <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80" onClick={onCut}>
        <Clipboard className="w-4 h-4 mr-2" /> Cut
      </button>
      <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80" onClick={onCopy}>
        <ClipboardCopy className="w-4 h-4 mr-2" /> Copy
      </button>
      <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80 disabled:text-white/40 disabled:hover:bg-transparent disabled:cursor-not-allowed" onClick={onPaste} disabled={!canPaste}>
        <ClipboardPaste className="w-4 h-4 mr-2" /> Paste
      </button>
      <div className="h-px bg-white/10 my-1" />
      <button className="flex items-center w-full px-3 py-1.5 text-left rounded hover:bg-white/10 text-white/80" onClick={onRename}>
        <Edit className="w-4 h-4 mr-2" /> Rename
      </button>
      <button className="flex items-center w-full px-3 py-1.5 text-left rounded text-red-400 hover:bg-red-400/20" onClick={onDelete}>
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </button>
    </div>
  );
}