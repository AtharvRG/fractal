"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Folder,
} from "lucide-react";
import React from "react";
import { getIconForFile, DEFAULT_FILE } from 'vscode-icons-js';

const ICONS_CDN_BASE = "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons/icons/";

function getVsCodeIconUrl(fileName: string) {
  try {
    const name = getIconForFile(fileName) || DEFAULT_FILE;
    return ICONS_CDN_BASE + name;
  } catch {
    return ICONS_CDN_BASE + DEFAULT_FILE;
  }
}

// Original binary file icon (restored)
const BinaryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#374151" />
    <text x="12" y="16" fontSize="10" textAnchor="middle" fill="#9EE493" fontFamily="monospace">BIN</text>
  </svg>
);

interface FileIconProps {
  isFolder: boolean;
  isBinary: boolean;
  fileName: string;
}

export function FileIcon({ isFolder, isBinary, fileName }: FileIconProps) {
  if (isFolder) {
    return <Folder className="w-4 h-4 text-sky-400 flex-shrink-0" />;
  }
  if (isBinary) {
    return <BinaryIcon />;
  }

  // Prefer official VS Code icons for all files
  const vsIcon = getVsCodeIconUrl(fileName);
  if (vsIcon) {
    return (
      <img
        src={vsIcon}
        alt={`${fileName} file`}
        width={16}
        height={16}
        className="w-4 h-4 flex-shrink-0"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          const fallback = ICONS_CDN_BASE + DEFAULT_FILE;
          if (target.src !== fallback) target.src = fallback;
        }}
      />
    );
  }
  // Fallback should not be reached; return default image icon just in case
  return (
    <img
      src={ICONS_CDN_BASE + DEFAULT_FILE}
      alt={`${fileName} file`}
      width={16}
      height={16}
      className="w-4 h-4 flex-shrink-0"
    />
  );
}