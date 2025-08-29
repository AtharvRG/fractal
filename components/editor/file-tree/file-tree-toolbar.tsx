import { FilePlus, FolderPlus, FileBox } from "lucide-react";

interface FileTreeToolbarProps {
  onAdd: (type: 'file' | 'folder' | 'binary') => void;
}

export function FileTreeToolbar({ onAdd }: FileTreeToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#282634] flex-shrink-0">
      <h2 className="text-sm font-bold text-white/80 font-sans tracking-wide uppercase">
        Explorer
      </h2>
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="New File"
          onClick={() => onAdd('file')}
        >
          <FilePlus className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="New Folder"
          onClick={() => onAdd('folder')}
        >
          <FolderPlus className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="New Binary Placeholder"
          onClick={() => onAdd('binary')}
        >
          <FileBox className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}