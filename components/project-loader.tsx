"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEditorStore } from '@/lib/store';
import { decompressFileSystemTree, decompressFileSystemTreeV2 } from '@/lib/compression';
import { decodeUrlShare, fetchAndDecodeShort } from '@/lib/share-url';
import { showToast } from '@/lib/toast-store';
import { normalizeImportedTree } from '@/lib/file-utils';
import { fetchGist } from '@/lib/github-gist';
import { Loader2 } from 'lucide-react';

export function ProjectLoader() {
  const setFileTree = useEditorStore((state) => state.setFileTree);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  // Guard to avoid double execution under React strict mode in dev
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return; // ensure single logical run
    didRunRef.current = true;
    const loadProject = async () => {
      // Support both fragment-based (#h:...) and path-based (/editor/h:...) styles
      let hash = window.location.hash;
      if (!hash) {
        // Attempt path-based: /editor/h:XYZ or /editor/hN:part1.part2
        const path = window.location.pathname; // e.g., /editor/h:abc or /editor/h2:part1.part2
        const match = path.match(/\/editor\/(h\d?:.+)$/i);
        if (match) {
          hash = '#' + match[1]; // Normalize into fragment-like form
        }
  }
      // If no hash, attempt localStorage restore (last loaded project)
      if (!hash) {
        try {
          const saved = localStorage.getItem('fractal:lastProject');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              // restored project from localStorage
              setFileTree(parsed);
              const keys = Object.keys(parsed);
              const firstFileId = keys.find(k => !k.endsWith('/')) || null;
              if (firstFileId) {
                useEditorStore.getState().setActiveFileId(firstFileId);
                // setActiveFileId after restore
              }
            }
          }
        } catch (e) {
          // failed parsing localStorage project
        }
        return;
      }

      let projectData = null;
      // Mark loading immediately for the UI
      setIsLoading(true);

  try {

        // Multi-part format: #hN:part1.part2[.part3]
        // Single-part format: #h:encoded
        const hashLower = hash.toLowerCase();
        const isMultiPart = /^#h(\d):/i.test(hash);
        if (hashLower.startsWith('#h:') || isMultiPart) {
          setStatus('Decompressing project...');
          let compressedData = '';
          if (isMultiPart) {
            try {
              const m = hash.match(/^#h(\d):(.+)/i);
              const partCount = m ? parseInt(m[1], 10) : 0;
              const rest = m ? m[2] : '';
              const rawParts = rest.split('.');
              if (partCount < 1 || partCount !== rawParts.length) {
                throw new Error(`Invalid multi-part hash: expected ${partCount} parts, got ${rawParts.length}`);
              }
              const decodedParts = rawParts.map(p => decodeURIComponent(p));
              compressedData = decodedParts.join('');
            } catch (e) {
              // (parse error silently handled; user feedback via status)
              setStatus('Failed to parse multi-part link.');
            }
          } else {
            // Decode in case the fragment was percent-encoded by the source app/browser
            compressedData = decodeURIComponent(hash.substring(3));
          }
          // Sanitize: remove whitespace & line breaks that can appear after manual editing / chat copy
          const originalLength = compressedData.length;
          compressedData = compressedData.replace(/\s+/g, '');
          if (compressedData.length !== originalLength) {
            // whitespace sanitized
          }
          // Validate pattern (very loose): optional mode prefix then base64url chars only
          const base64UrlPattern = /^(?:[pn]\.)?[A-Za-z0-9_-]+$/;
          if (!base64UrlPattern.test(compressedData)) {
            // attempting repairs of corrupted payload
            // Common corruption cases from manual edits:
            // 1. '.' accidentally removed after mode prefix (e.g., 'n' instead of 'n.')
            if (/^[pn][A-Za-z0-9_-]/.test(compressedData) && !compressedData.startsWith('p.') && !compressedData.startsWith('n.')) {
              compressedData = compressedData[0] + '.' + compressedData.slice(1);
              // repaired missing mode dot
            }
            // 2. Percent encodings left inside (e.g., p.%2Fabc)
            if (/%[0-9A-Fa-f]{2}/.test(compressedData)) {
              try {
                const decTwice = decodeURIComponent(compressedData);
                if (base64UrlPattern.test(decTwice)) {
                  compressedData = decTwice;
                  // applied double decode repair
                }
              } catch {/* ignore */}
            }
            // 3. Accidental spaces turned into '+' by some tools (reverse not usually needed, but handle)
            if (compressedData.includes('+')) {
              compressedData = compressedData.replace(/\+/g, '-'); // not perfect, but retain url-safe alphabet
              // replaced + with - heuristic
            }
          }
          // Basic validation & repair heuristics complete
          // New format detection: comma-separated segments with final 8-char checksum
          if (compressedData.includes(',') && /,[0-9a-fA-F]{8}$/.test(compressedData)) {
            const remainder = compressedData; // already after #h:
            const { tree, error } = await decodeUrlShare(remainder);
            if (error) {
              showToast(`Link corrupted: ${error}`, { type: 'error' });
            }
            projectData = tree;
          } else {
            try {
              if (compressedData.startsWith('v2:')) {
                projectData = decompressFileSystemTreeV2(compressedData);
              } else {
                projectData = decompressFileSystemTree(compressedData);
              }
            } catch (err) {
              showToast('Legacy link decode failed', { type: 'error' });
            }
          }
          try {
            // (decompress result logging removed)
            if (!projectData) {
              // Attempt a recovery by trying to force-add an 'n.' prefix if missing
              if (!compressedData.startsWith('p.') && !compressedData.startsWith('n.')) {
                const attempt = 'n.' + compressedData;
                // retry with forced n. prefix
                const retry = decompressFileSystemTree(attempt);
                if (retry) {
                  projectData = retry;
                  // recovery succeeded
                }
              }
            }
          } catch (err) { /* handled above */ }

  } else if (hash.startsWith('#s:') || hash.startsWith('#S:')) {
          setStatus('Resolving short link...');
          const shortId = decodeURIComponent(hash.substring(3));
          // short link resolution
          let decodedTree: any = null;
          // First attempt network fetch
          const fetched = await fetchAndDecodeShort(window.location.origin, shortId);
          if (fetched.error) {
            // (short link fetch error handled)
            // Try local fallback mapping if exists
            try {
              const remainder = localStorage.getItem(`fractal:short:${shortId}`);
              if (remainder) {
                // using local fallback mapping
                const { tree, error } = await decodeUrlShare(remainder);
                if (error) {
                  // local decode error
                } else {
                  decodedTree = tree;
                  // Replace hash with full #h: form so refresh works
                  history.replaceState(null, '', window.location.pathname + '#h:' + remainder);
                  // replaced hash with full payload
                }
              }
            } catch {/* ignore */}
            if (!decodedTree) showToast('Short link fetch failed', { type: 'error' });
          } else {
            decodedTree = fetched.tree;
          }
          projectData = decodedTree;
        } else if (hash.startsWith('#sb:') || hash.startsWith('#SB:')) {
          setStatus('Resolving cloud short link...');
          const shortId = decodeURIComponent(hash.substring(4));
          // cloud short link resolution
          try {
            const res = await fetch(`/api/shorten?id=${encodeURIComponent(shortId)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.payload) {
                const { tree, error } = await decodeUrlShare(data.payload);
                if (error) {
                  showToast(error, { type: 'error' });
                } else {
                  projectData = tree;
                  history.replaceState(null, '', window.location.pathname + '#h:' + data.payload);
                  // expanded to full hash
                }
              } else {
                showToast('Short link missing payload', { type: 'error' });
              }
            } else {
              showToast('Short link not found', { type: 'error' });
            }
          } catch {
            showToast('Short link network error', { type: 'error' });
          }
        } else if (hash.startsWith('#g:') || hash.startsWith('#G:')) {
          setStatus('Fetching project from Gist...');
          const gistId = decodeURIComponent(hash.substring(3));
          // gist fetch
          try {
            projectData = await fetchGist(gistId);
            // (gist fetch result logging removed)
          } catch (err) {
            setStatus('Failed to load project from Gist.');
          }
        } else {
          // unsupported hash prefix
        }

            if (projectData) {
            try {
              if (typeof projectData === 'object' && projectData !== null) {
                // Normalize imported tree to ensure binary placeholders are correctly marked
                projectData = normalizeImportedTree(projectData as any);
                // normalized imported tree
              }
            } catch (e) {
              // normalization failed (silenced)
            }
            try {
            setStatus('Project loaded. Redirecting...');
            // Log a small summary of the project data to avoid huge dumps
            // file count omitted (unused)
            setFileTree(projectData);
            // Persist (best-effort) for reload resilience if size reasonable (< ~2MB JSON)
            try {
              const json = JSON.stringify(projectData);
              if (json.length < 2_000_000) { // ~2MB safeguard
                localStorage.setItem('fractal:lastProject', json);
                // persisted locally
              } else {
                // skip persist (too large)
              }
            } catch (e) {
              // persist failed
            }
            // file tree set

            // Auto-select a default file to avoid an apparently "empty" editor
            try {
              const keys = Object.keys(projectData);
              const firstFileId = keys.find(k => !k.endsWith('/')) || null;
              if (firstFileId) {
                useEditorStore.getState().setActiveFileId(firstFileId);
                // setActiveFileId
              }
            } catch (e) {
              /* ignore */
            }
          } catch (err) {
          }

          // Navigate to editor if not already there
          if (pathname !== '/editor') {
            try {
              router.push('/editor');
            } catch {/* ignore */}
          }
        }
      } finally {
        // Only hide loading overlay (keep hash so user can refresh/share)
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };
    
    // Run only once on initial mount
    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-tuna/90 backdrop-blur-md font-sans">
      <Loader2 className="w-10 h-10 animate-spin text-aquamarine" />
      <p className="mt-4 text-white/80">{status}</p>
    </div>
  );
}