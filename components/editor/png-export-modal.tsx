"use client";

import React from "react";
import { X } from "lucide-react";

interface PngExportModalProps {
  onClose: () => void;
}

export function PngExportModal({ onClose }: PngExportModalProps) {
  // PNG export currently disabled — placeholder modal until feature is reimplemented.

  // Placeholder UI removed (feature disabled)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans" onClick={onClose}>
      <div className="bg-[#2c2a3b] rounded-xl p-6 w-full max-w-lg shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white/90">Export Snapshot</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-white/70"/></button>
        </div>
        
  <p className="text-sm text-white/60 mb-6">Snapshot export is temporarily disabled. Why?</p>

        <div className="flex justify-center items-center my-6">
          <div className="text-sm text-white/70">Good things take time to ripe, and wait this one’s raw yet!</div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded-md bg-white/10 text-white/90 hover:bg-white/20 transition-colors" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}