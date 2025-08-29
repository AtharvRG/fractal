"use client";

import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelGroupHandle, PanelGroupOnLayout } from "react-resizable-panels";
import { FileTreeStrip } from "./file-tree-strip";
import { GlobalToolbar } from "./global-toolbar";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { MobileLayout } from "./mobile/mobile-layout";
import dynamic from 'next/dynamic'; // <-- Import dynamic
import { Loader2 } from "lucide-react";

// Dynamically import client-side only components to prevent SSR issues
const CodeIdeStrip = dynamic(() => import('./code-ide-strip').then(mod => ({ default: mod.CodeIdeStrip })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading Editor...</div>,
});

// THIS IS THE CRITICAL FIX:
// We dynamically import the AstStrip with SSR disabled.
// This guarantees that no code inside AstStrip or its imports (like our parser)
// will ever be executed on the server.
const AstStrip = dynamic(() => import('./ast-strip'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="w-6 h-6 animate-spin" /></div>,
});


const DEFAULT_LAYOUT = [18, 60, 22];

function DesktopLayout() {
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [layout, setLayout] = useState<number[]>(DEFAULT_LAYOUT);
  
  const handleLayout: PanelGroupOnLayout = (sizes: number[]) => {
    if (sizes.every(size => size > 0)) { setLayout(sizes); }
  };

  const collapseLeft = () => { panelGroupRef.current?.setLayout([0, layout[0] + layout[1], layout[2]]); };
  const expandLeft = () => { panelGroupRef.current?.setLayout(layout); };
  const collapseRight = () => { panelGroupRef.current?.setLayout([layout[0], layout[1] + layout[2], 0]); };
  const expandRight = () => { panelGroupRef.current?.setLayout(layout); };

  return (
    <div className="flex flex-col h-screen bg-tuna text-white font-mono">
      <GlobalToolbar isMobile={false} collapseLeft={collapseLeft} expandLeft={expandLeft} collapseRight={collapseRight} expandRight={expandRight} />
      {/* min-h-0 ensures the flex child can shrink and allows internal scroll instead of page elongation */}
      <main className="flex-grow min-h-0 flex">
        <PanelGroup className="flex-1 h-full" direction="horizontal" id="editor-root" ref={panelGroupRef} onLayout={handleLayout}>
          <Panel defaultSize={DEFAULT_LAYOUT[0]} minSize={12} collapsible={true} id="file-tree" data-panel-id="file-tree"><FileTreeStrip /></Panel>
          <PanelResizeHandle className="w-1.5 bg-[#282634] hover:bg-aquamarine/80 focus:outline-none focus:bg-aquamarine transition-colors duration-200" />
          <Panel minSize={30} id="code-ide" data-panel-id="code-ide"><CodeIdeStrip /></Panel>
          <PanelResizeHandle className="w-1.5 bg-[#282634] hover:bg-aquamarine/80 focus:outline-none focus:bg-aquamarine transition-colors duration-200" />
          <Panel defaultSize={DEFAULT_LAYOUT[2]} minSize={17} collapsible={true} id="ast-view" data-panel-id="ast-view"><AstStrip /></Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export function EditorLayout() {
  const store = useEditorStore();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') { e.preventDefault(); store.toggleVimMode(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); if (store.activeFileId) { store.setActiveFileId(store.activeFileId); } }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  return (
    <>
      <div className="hidden md:block"><DesktopLayout /></div>
      <div className="block md:hidden"><MobileLayout /></div>
    </>
  );
}