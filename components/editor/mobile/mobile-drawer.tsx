"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position: 'left' | 'right';
}

export function MobileDrawer({ isOpen, onClose, title, children, position }: MobileDrawerProps) {
  const variants = {
    hidden: { x: position === 'left' ? "-100%" : "100%" },
    visible: { x: "0%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} h-full w-[85%] max-w-sm z-50 bg-[#2c2a3b] flex flex-col md:hidden`}
          >
            <header className="flex items-center justify-between p-2 bg-[#282634] border-b border-white/10 flex-shrink-0">
              <h2 className="text-sm font-bold text-white/80 font-sans tracking-wide uppercase">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-white/70"/>
              </button>
            </header>
            <div className="flex-grow overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}