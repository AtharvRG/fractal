"use client";
import React, { useCallback, useEffect } from 'react';
import { useDialogStore } from '@/lib/dialog-store';

export function DialogHost() {
  const queue = useDialogStore(s => s.queue);
  const closeTop = useDialogStore(s => s.closeTop);
  const top = queue[0];

  const onKey = useCallback((e: KeyboardEvent) => {
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTop(false);
    } else if (e.key === 'Enter') {
      if (top.type === 'alert' || top.type === 'confirm') {
        e.preventDefault();
        closeTop(true);
      }
    }
  }, [top, closeTop]);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (!top) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={() => closeTop(false)}>
      <div className="mx-4 w-full max-w-sm rounded-xl border border-white/10 bg-[#2c2a3b] shadow-xl p-5 text-white/90 relative" onMouseDown={e => e.stopPropagation()}>
        {top.title && <h3 className="text-base font-semibold mb-2 text-white/95">{top.title}</h3>}
        <div className="text-sm leading-relaxed whitespace-pre-wrap mb-5 max-h-60 overflow-y-auto font-sans">
          {top.message}
        </div>
        <div className="flex justify-end gap-3">
          {top.type === 'confirm' && (
            <button onClick={() => closeTop(false)} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white/80 text-sm">Cancel</button>
          )}
          <button onClick={() => closeTop(true)} className="px-4 py-2 rounded-md bg-aquamarine text-tuna font-semibold hover:bg-aquamarine/90 text-sm min-w-[72px]">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
