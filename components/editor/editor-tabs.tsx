"use client";

import { useEditorStore } from "@/lib/store";
import { X, Circle } from "lucide-react";
import { FileIcon } from "./file-tree/file-icon";

export function EditorTabs() {
  const { openFileIds, activeFileId, dirtyFileIds, setActiveFileId, closeFile, fileTree } = useEditorStore();

  if (openFileIds.length === 0) {
    return null; // Don't render the bar if no files are open
  }

  return (
    <div className="flex bg-[#211f2c] border-b border-white/10 flex-shrink-0">
      {openFileIds.map(id => {
        const file = fileTree[id];
        if (!file) return null;
        const isActive = id === activeFileId;
        const isDirty = dirtyFileIds.has(id);

        return (
          <div
            key={id}
            onClick={() => setActiveFileId(id)}
            className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 border-r border-white/10 cursor-pointer text-sm font-sans relative transition-colors ${
              isActive ? "bg-[#282634] text-white/90" : "text-white/60 hover:bg-white/5"
            }`}
          >
            {/* Active tab indicator */}
            {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-aquamarine" />}
            
            <FileIcon isBinary={file.isBinary} isFolder={false} fileName={file.name} />
            <span className={isDirty ? "italic" : ""}>{file.name}</span>

            {/* CORRECTED CLOSE BUTTON LOGIC */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(id);
              }}
              className="p-0.5 rounded-sm w-5 h-5 flex items-center justify-center"
            >
              {/* Icon that appears ONLY on hover */}
              <X className="w-4 h-4 text-white/70 opacity-0 group-hover:opacity-100" />

              {/* Icon that appears ONLY when NOT hovered */}
              <div className="absolute group-hover:opacity-0">
                {isDirty ? (
                  <Circle className="w-3 h-3 fill-current text-white/70" />
                ) : (
                  // This spacer is invisible but occupies the same space, preventing layout shift
                  <div className="w-3 h-3" />
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}