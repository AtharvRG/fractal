export interface ExportOptions {
  includeFileTree?: boolean;
  includeCodeIde?: boolean;
  includeAst?: boolean;
  mode?: 'visible' | 'strips';
  margin?: number; // pixels
  pixelRatio?: number; // 1,2,3
  toPdf?: boolean;
  fileName?: string;
  onProgress?: (p: number) => void;
}

// PNG export is temporarily disabled. Expose lightweight stubs so callers keep working.
import { showAlert } from '@/lib/dialog-store';

export async function downloadPng(_options: ExportOptions) {
  showAlert('PNG export is temporarily disabled. This feature will be re-enabled later.', 'PNG Export');
}

export async function createVisibleExportPreview(_options: ExportOptions) {
  // Return a small object that matches the API used by callers but does nothing.
  const wrapper = document.createElement('div');
  const downloadFallback = async (_fileName?: string) => { showAlert('PNG export is temporarily disabled.', 'PNG Export'); };
  const remove = () => { if (wrapper.parentElement) wrapper.parentElement.removeChild(wrapper); };
  return { wrapper, downloadFallback, remove };
}
