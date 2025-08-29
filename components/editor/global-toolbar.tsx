"use client";

import { ChevronsLeft, ChevronsRight, Camera, Share2, PanelLeft, PanelRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from '@/lib/store';
import { showToast } from '@/lib/toast-store';
import { showConfirm } from '@/lib/dialog-store';
import { ShareDialog } from "./share-dialog";
import { PngExportModal } from "./png-export-modal";

interface GlobalToolbarProps {
  collapseLeft: () => void;
  expandLeft: () => void;
  collapseRight: () => void;
  expandRight: () => void;
  isMobile: boolean;
}

export function GlobalToolbar({ collapseLeft, expandLeft, collapseRight, expandRight, isMobile }: GlobalToolbarProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPngModalOpen, setIsPngModalOpen] = useState(false);
  
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const handleToggleLeft = () => {
    if (isLeftCollapsed) { expandLeft(); } else { collapseLeft(); }
    setIsLeftCollapsed(!isLeftCollapsed);
  };
  
  const handleToggleRight = () => {
    if (isRightCollapsed) { expandRight(); } else { collapseRight(); }
    setIsRightCollapsed(!isRightCollapsed);
  };
  const clearSession = useEditorStore(s => s.clearSession);
  const handleClear = async () => {
    const ok = await showConfirm('This will wipe the current in-browser project state. (Local backup in localStorage will also be cleared.)\n\nProceed?', 'Clear Project?');
    if (ok) {
      clearSession();
      try { localStorage.removeItem('fractal:lastProject'); } catch { /* ignore */ }
      showToast('Session cleared', { type: 'success' });
    }
  };

  return (
    <header className="flex items-center justify-between p-2 bg-[#282634] border-b border-white/10 flex-shrink-0">
      <div className="flex items-center gap-2">
        <button 
          className="p-1.5 rounded hover:bg-white/10 transition-colors" 
          title={isMobile ? "Toggle Explorer" : (isLeftCollapsed ? "Expand Left Pane" : "Collapse Left Pane")}
          onClick={handleToggleLeft}
        >
          {isMobile ? <PanelLeft className="w-5 h-5" /> : (isLeftCollapsed ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />)}
        </button>
        <button 
          className="p-1.5 rounded hover:bg-white/10 transition-colors" 
          title={isMobile ? "Toggle AST Explorer" : (isRightCollapsed ? "Expand Right Pane" : "Collapse Right Pane")}
          onClick={handleToggleRight}
        >
          {isMobile ? <PanelRight className="w-5 h-5" /> : (isRightCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />)}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 p-1.5 px-3 rounded hover:bg-white/10 transition-colors text-sm font-sans"
          onClick={() => setIsPngModalOpen(true)}
        >
          <Camera className="w-4 h-4" />
          <span>Export Snapshot</span>
        </button>
        <button
          className="flex items-center gap-2 p-1.5 px-3 rounded hover:bg-white/10 transition-colors text-sm font-sans"
          onClick={handleClear}
          title="Clear current session/project"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </button>
        <button
          className="flex items-center gap-2 p-1.5 px-3 rounded bg-aquamarine text-tuna font-bold hover:bg-aquamarine/90 transition-colors text-sm font-sans"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {isShareDialogOpen && <ShareDialog onClose={() => setIsShareDialogOpen(false)} />}
      {isPngModalOpen && <PngExportModal onClose={() => setIsPngModalOpen(false)} />}
    </header>
  );
}