"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import { FileTreeStrip } from "../file-tree-strip";
import { GlobalToolbar } from "../global-toolbar";
import { MobileDrawer } from "./mobile-drawer";
import { Loader2 } from "lucide-react";

const CodeIdeStrip = dynamic(() => import('../code-ide-strip').then(mod => ({ default: mod.CodeIdeStrip })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading Editor...</div>,
});

const AstStrip = dynamic(() => import('../ast-strip'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="w-6 h-6 animate-spin" /></div>,
});

export function MobileLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAstOpen, setIsAstOpen] = useState(false);

  // (dummy collapse handlers unused on mobile)

  return (
    <div className="flex flex-col h-screen bg-tuna text-white font-mono">
      <GlobalToolbar 
        collapseLeft={() => setIsNavOpen(true)}
        expandLeft={() => setIsNavOpen(false)}
        collapseRight={() => setIsAstOpen(true)}
        expandRight={() => setIsAstOpen(false)}
        isMobile={true}
      />

      <main className="flex-grow">
        <CodeIdeStrip />
      </main>

      <MobileDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        title="Explorer"
        position="left"
      >
        <FileTreeStrip />
      </MobileDrawer>

      <MobileDrawer
        isOpen={isAstOpen}
        onClose={() => setIsAstOpen(false)}
        title="AST Explorer"
        position="right"
      >
        <AstStrip />
      </MobileDrawer>
    </div>
  );
}