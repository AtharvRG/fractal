"use client";
import React from 'react';
import { useToastStore } from '@/lib/toast-store';

const typeStyles: Record<string, string> = {
  info: 'bg-white/10 text-white/90 border-white/15',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  error: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
};

export function ToastHost() {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);
  return (
    <div className="fixed z-[250] bottom-4 right-4 flex flex-col gap-3 max-w-sm w-[min(100%,360px)] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto border backdrop-blur-md rounded-lg px-4 py-3 shadow-lg text-sm font-sans ${typeStyles[t.type || 'info']}`}> 
          <div className="flex items-start gap-3">
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{t.message}</div>
            <button aria-label="close" className="text-white/50 hover:text-white/90 text-xs" onClick={() => dismiss(t.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
