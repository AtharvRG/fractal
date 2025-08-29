"use client";

import { useEditorStore } from "@/lib/store";

export function CodeIdeStatusBar() {
  const { vimMode, toggleVimMode, activeFile } = useEditorStore((state) => ({
    vimMode: state.vimMode,
    toggleVimMode: state.toggleVimMode,
    activeFile: state.getActiveFile(),
  }));

  const language = activeFile?.name.split('.').pop() || 'plaintext';

  return (
    <div className="flex items-center justify-between text-xs px-4 py-1 bg-[#211f2c] border-t border-white/10 text-white/60 font-sans">
      <div className="flex items-center gap-4">
        <span>{language}</span>
      </div>
      <button 
        className="hover:text-aquamarine transition-colors"
        onClick={toggleVimMode}
        title="Toggle VIM Mode (Ctrl+Shift+V)"
      >
        {vimMode ? "VIM" : "NORMAL"}
      </button>
    </div>
  );
}