"use client";

import {
  File,
  Folder,
  FileText,
  Database,
  Archive,
  Music,
  Film,
  Lock
} from "lucide-react";
import React from "react";

// (Removed unused DefaultFileIcon for bundle size)

const CodeFileIcon = ({ color = "#519aba" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 14V2H9L7 4H2v10h12z" 
      fill="none" 
      stroke={color} 
      strokeWidth="1"
    />
    <path 
      d="M5 9l1.5 1.5L5 12m3-1h3" 
      fill="none" 
      stroke={color} 
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

const JsonFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 14V2H9L7 4H2v10h12z" 
      fill="none" 
      stroke="#c1a60e" 
      strokeWidth="1"
    />
    <path 
      d="M5 8h1v3h-1M8 8h2v3H8M11 8h1v3h-1" 
      fill="none" 
      stroke="#c1a60e" 
      strokeWidth="0.8"
    />
  </svg>
);

const MarkdownFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 14V2H9L7 4H2v10h12z" 
      fill="none" 
      stroke="#519aba" 
      strokeWidth="1"
    />
    <path 
      d="M4 10V8l1 1 1-1v2M9 8v2h2V8" 
      fill="none" 
      stroke="#519aba" 
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImageFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 14V2H9L7 4H2v10h12z" 
      fill="none" 
      stroke="#a074c4" 
      strokeWidth="1"
    />
    <circle cx="6" cy="8" r="1" fill="#a074c4"/>
    <path 
      d="M4 12l2-2 2 2 3-3" 
      fill="none" 
      stroke="#a074c4" 
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConfigFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 14V2H9L7 4H2v10h12z" 
      fill="none" 
      stroke="#6c7086" 
      strokeWidth="1"
    />
    <circle cx="8" cy="9" r="1.5" fill="none" stroke="#6c7086" strokeWidth="0.8"/>
    <path 
      d="M8 7v1M8 11v1M10 9h1M6 9H5" 
      stroke="#6c7086" 
      strokeWidth="0.8"
      strokeLinecap="round"
    />
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
    return <File className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  const name = fileName.toLowerCase();

  // Special file names
  if (name === 'dockerfile' || name === 'dockerfile.dev') return <ConfigFileIcon />;
  if (name === 'package.json' || name === 'package-lock.json' || name === 'tsconfig.json') return <JsonFileIcon />;
  if (name === 'yarn.lock' || name === 'pnpm-lock.yaml' || name === 'composer.lock') {
    return <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
  if (name === 'readme' || name.startsWith('readme.')) return <MarkdownFileIcon />;
  if (name === 'license' || name.startsWith('license.')) {
    return <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  }

  // File extensions
  switch (extension) {
    // Code files - VS Code blue
    case 'js': case 'mjs': case 'cjs': case 'jsx':
    case 'ts': case 'tsx':
    case 'py': case 'pyw':
    case 'go':
    case 'java':
    case 'rs': case 'rust':
    case 'c': case 'h':
    case 'cpp': case 'cc': case 'cxx': case 'hpp': case 'c++':
    case 'rb': case 'ruby':
    case 'php':
    case 'lua':
    case 'html': case 'htm':
    case 'css': case 'scss': case 'sass': case 'less':
    case 'vue':
    case 'svelte':
      return <CodeFileIcon />;

    // JSON files - VS Code yellow
    case 'json': case 'jsonc':
      return <JsonFileIcon />;

    // Markup files - VS Code blue
    case 'xml': case 'xhtml':
    case 'yaml': case 'yml':
    case 'md': case 'markdown':
      return <MarkdownFileIcon />;

    // Config files - VS Code gray
    case 'toml': case 'ini': case 'conf': case 'config':
    case 'env':
      return <ConfigFileIcon />;

    // Images - VS Code purple
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': case 'ico':
      return <ImageFileIcon />;

    // Archives
    case 'zip': case 'tar': case 'gz': case 'rar': case '7z':
      return <Archive className="w-4 h-4 text-gray-500 flex-shrink-0" />;

    // Media files
    case 'mp3': case 'wav': case 'ogg': case 'flac':
      return <Music className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
    case 'mp4': case 'mov': case 'webm': case 'avi':
      return <Film className="w-4 h-4 text-orange-400 flex-shrink-0" />;

    // Database files
    case 'sql': case 'mysql': case 'pgsql':
    case 'csv': case 'tsv':
      return <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />;

    // Text/Document files
    case 'txt': case 'log':
    case 'doc': case 'docx':
    case 'pdf':
      return <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />;

    // Lock files
    case 'lock':
      return <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />;

    // Default file
    default:
      return <File className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  }
}
