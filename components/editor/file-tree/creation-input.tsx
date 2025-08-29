"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileIcon } from "./file-icon";

type CreationType = 'file' | 'folder' | 'binary';

interface CreationInputProps {
  type: CreationType;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function CreationInput({ type, onSubmit, onCancel }: CreationInputProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (name.trim()) onSubmit(name.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center p-1 rounded">
      <div className="w-4 mr-1"></div>
      <FileIcon isBinary={type === 'binary'} isFolder={type === 'folder'} fileName={name || `new-${type}`} />
      <input
        ref={inputRef}
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown} onBlur={onCancel}
        className="ml-2 text-sm bg-transparent border border-aquamarine/50 rounded-sm px-1 outline-none text-white w-full"
        placeholder={`New ${type} name...`}
      />
    </div>
  );
}