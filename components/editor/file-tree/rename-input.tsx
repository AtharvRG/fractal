"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileIcon } from "./file-icon";

interface RenameInputProps {
  originalName: string;
  isFolder: boolean;
  isBinary: boolean;
  onSubmit: (newName: string) => void;
  onCancel: () => void;
}

export function RenameInput({ originalName, isFolder, isBinary, onSubmit, onCancel }: RenameInputProps) {
  const [name, setName] = useState(originalName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (name.trim() && name.trim() !== originalName) {
        onSubmit(name.trim());
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center p-1 rounded">
      <div className="w-4 mr-1"></div>
      <FileIcon isBinary={isBinary} isFolder={isFolder} fileName={name} />
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSubmit(name.trim())} // Submit on blur
        className="ml-2 text-sm bg-transparent border border-aquamarine/50 rounded-sm px-1 outline-none text-white w-full"
      />
    </div>
  );
}