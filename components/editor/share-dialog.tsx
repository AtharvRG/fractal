"use client";

import { useEditorStore } from "@/lib/store";
import React, { useEffect, useState } from "react";
import { createGist } from "@/lib/github-gist";
import { useAuthStore } from '@/lib/auth-store';
import { showToast } from '@/lib/toast-store';
import { compressProject, buildUrlShare, exceedsUrlThreshold } from '@/lib/share-url';
import { showAlert, showConfirm } from '@/lib/dialog-store';
import { Check, Copy, Github, Link as LinkIcon, Loader2, X, Cloud, Trash2 } from "lucide-react";
import Link from "next/link";

interface ShareDialogProps {
  onClose: () => void;
}

const RAW_SIZE_GIST_THRESHOLD = 10 * 1024 * 1024; // raw size check stays for quick early gist decision

export function ShareDialog({ onClose }: ShareDialogProps) {
  const fileTree = useEditorStore((state) => state.fileTree);
  const [shareUrl, setShareUrl] = useState("");
  const [fullUrl, setFullUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'url' | 'gist' | 'badge'>('url');
  const [gistNeeded, setGistNeeded] = useState(false);
  const [pat, setPat] = useState(""); // fallback manual token
  const githubToken = useAuthStore(s => s.githubToken);
  const [copiedItem, setCopiedItem] = useState<null | 'url' | 'markdown'>(null);
  // Supabase short link state
  const [sbId, setSbId] = useState<string | null>(null);
  const [sbExpiry, setSbExpiry] = useState<string | null>(null);
  const [sbCreating, setSbCreating] = useState(false);
  const [sbCopying, setSbCopying] = useState(false);
  const [sbError, setSbError] = useState<string | null>(null);
  const [ttl, setTtl] = useState<string>('604800'); // default 7 days in seconds
  const supabaseEnvPresent = typeof window !== 'undefined' && !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  // legacy state removed: shorten flow replaced by tabbed UI

  useEffect(() => {
    const generate = async () => {
      if (Object.keys(fileTree).length === 0) {
        setShareUrl("Project is empty. Add files to share.");
        setIsLoading(false);
        return;
      }
      try {
        // Raw size check for early gist decision.
        let rawBytes = 0;
        const encoder = new TextEncoder();
        for (const node of Object.values(fileTree)) {
          if (typeof node.content === 'string') {
            rawBytes += encoder.encode(node.content).length;
            if (rawBytes > RAW_SIZE_GIST_THRESHOLD) break;
          }
        }
        if (rawBytes > RAW_SIZE_GIST_THRESHOLD) {
          setGistNeeded(true);
        }
  const { compressed, byteLength } = await compressProject(fileTree);
        if (exceedsUrlThreshold(byteLength) || rawBytes > RAW_SIZE_GIST_THRESHOLD) {
          setGistNeeded(true);
          setMode('gist');
        } else {
          const root = window.location.origin.replace(/\/$/, '');
          const { url } = await buildUrlShare(root, compressed);
          setShareUrl(url);
          setFullUrl(url);
        }
      } catch (e) {
        // compression error (silenced)
        setShareUrl("Failed to compress project.");
        setMode('url');
      } finally {
        setIsLoading(false);
      }
    };
    generate();
  }, [fileTree]);

  const handleCreateGist = async () => {
    const tokenToUse = githubToken || pat;
    if (!tokenToUse) { showAlert("Connect GitHub or provide a PAT.", 'Missing Token'); return; }
    setIsLoading(true);
    const gistId = await createGist(fileTree, tokenToUse);
    if (gistId) {
      const rootUrl = window.location.origin;
  setShareUrl(`${rootUrl}/editor/#g:${gistId}`);
      setMode('url');
    } else {
      showToast('Failed to create gist.', { type: 'error' });
    }
    setIsLoading(false);
  };

  const handleCopy = (type: 'url' | 'markdown') => {
    const isError = shareUrl.includes("empty") || shareUrl.includes("Failed");
    if (shareUrl && !isError) {
      let textToCopy = shareUrl;
      if (type === 'markdown') {
        const badgeUrl = `${window.location.origin}/badge.svg`;
        textToCopy = `[![Explore in Fractal](${badgeUrl})](${shareUrl})`;
      }
      const safeCopy = async (text: string) => {
        // Prefer async clipboard API if available & secure context
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
          }
        } catch {/* fall through to legacy */}
        // Legacy fallback using a hidden textarea
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          ta.style.opacity = '0';
            document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          return ok;
        } catch {
          return false;
        }
      };
      safeCopy(textToCopy).then((ok) => {
        if (ok) {
          setCopiedItem(type);
          if (type === 'url') showToast('URL copied', { type: 'success' });
          if (type === 'markdown') showToast('Markdown copied', { type: 'success' });
          setTimeout(() => setCopiedItem(null), 2000);
        } else {
          // Clipboard copy failed – no API available (silenced)
          showAlert('Copy failed: your browser does not permit programmatic clipboard access here. Please copy manually.', 'Copy Failed');
        }
      });
    }
  };

  const isShareable = shareUrl && !shareUrl.includes("empty") && !shareUrl.includes("Failed");

  // Download helpers for OS-specific link file types
  const downloadFile = (name: string, content: string, type = 'text/plain') => {
    try {
      const blob = new Blob([content], { type: type + ';charset=utf-8' });
      const a = document.createElement('a');
      a.download = name;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      showToast('Download ready', { type: 'success' });
    } catch {
      showToast('Download failed', { type: 'error' });
    }
  };

  const baseLink = fullUrl || shareUrl;

  const extractRemainder = (): string | null => {
    const link = baseLink || '';
    const idx = link.indexOf('#h:');
    if (idx === -1) return null;
    return link.substring(idx + 3); // after #h:
  };

  const createSupabaseShort = async () => {
    setSbError(null);
    if (gistNeeded) { setSbError('Project too large for #h: link – create a Gist instead.'); return; }
    const remainder = extractRemainder();
    if (!remainder) { setSbError('Full #h: link not ready yet'); return; }
    try {
      setSbCreating(true);
      const ttlSeconds = ttl === 'none' ? undefined : parseInt(ttl, 10);
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: remainder, ttlSeconds })
      });
      let data: any = null;
      try { data = await res.json(); } catch {/* ignore */}
      if (!res.ok) {
        const msg = data?.error ? `Failed: ${data.error}${data.code? ' ('+data.code+')':''}${data.details? ': '+data.details:''}` : 'Failed to create short link';
        setSbError(msg);
      } else {
        if (data?.id) {
          setSbId(data.id);
          setSbExpiry(data.expires_at || null);
          showToast('Cloud short link created', { type: 'success' });
        } else {
          setSbError('Invalid server response');
        }
      }
    } catch (e) {
      setSbError('Network error');
    } finally {
      setSbCreating(false);
    }
  };

  const deleteSupabaseShort = async () => {
    if (!sbId) return;
    try {
      const res = await fetch(`/api/shorten?id=${encodeURIComponent(sbId)}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Short link deleted', { type: 'success' });
        setSbId(null); setSbExpiry(null);
      } else {
        showToast('Delete failed', { type: 'error' });
      }
    } catch {
      showToast('Network error', { type: 'error' });
    }
  };

  const cloudShortUrl = sbId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/editor/#sb:${sbId}` : '';
  const [hitCount, setHitCount] = useState<number | null>(null);

  const refreshHitCount = async () => {
    if (!sbId) return;
    try {
      const res = await fetch(`/api/shorten?id=${encodeURIComponent(sbId)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.hit_count === 'number') setHitCount(data.hit_count);
      }
    } catch {/* ignore */}
  };

  const copyCloudShort = async () => {
    if (!cloudShortUrl) return;
    try {
      setSbCopying(true);
      await navigator.clipboard.writeText(cloudShortUrl);
      showToast('Short URL copied', { type: 'success' });
      setTimeout(() => setSbCopying(false), 1200);
    } catch {
      setSbCopying(false);
      showAlert('Clipboard denied – copy manually:\n' + cloudShortUrl, 'Copy Failed');
    }
  };

  const downloadHtmlRedirect = () => {
    if (!baseLink.includes('#h:')) { showToast('Link not ready', { type: 'error' }); return; }
    const safeLink = baseLink.replace(/"/g,'&quot;');
    const idPart = safeLink.split('#h:')[1]?.slice(0,12).replace(/[^A-Za-z0-9_-]/g,'') || 'fractal';
    const html = `<!DOCTYPE html><html lang="en"><meta charset=utf-8><title>Fractal Project</title><meta name=viewport content=width=device-width,initial-scale=1>`+
      `<style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#1e1d26;color:#eee;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center}a{color:#7fffd4}code{background:#2c2a3b;padding:.25rem .45rem;border-radius:4px;font-size:.85em}</style>`+
      `<h1>Opening Fractal Project…</h1><p>If not redirected <a href="${safeLink}">tap here</a>.</p>`+
      `<p style=font-size:12px;opacity:.6>This file just redirects to a self-contained Fractal link.</p>`+
      `<script>const u="${safeLink}";try{location.replace(u);}catch{location.href=u;}</script>`;
    downloadFile(`fractal-link-${idPart}.html`, html, 'text/html');
  };
  const downloadWindowsUrl = () => {
    if (!baseLink.includes('#h:')) { showToast('Link not ready', { type: 'error' }); return; }
    const content = `[InternetShortcut]\nURL=${baseLink}\nIconFile=${baseLink.split('#')[0]}/favicon.ico\n`; // optional icon
    downloadFile('Fractal Project.url', content);
  };
  const downloadMacWebloc = () => {
    if (!baseLink.includes('#h:')) { showToast('Link not ready', { type: 'error' }); return; }
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>URL</key><string>${baseLink}</string></dict></plist>`;
    downloadFile('Fractal Project.webloc', content, 'application/xml');
  };
  const downloadLinuxDesktop = () => {
    if (!baseLink.includes('#h:')) { showToast('Link not ready', { type: 'error' }); return; }
    const content = `[Desktop Entry]\nType=Link\nName=Fractal Project\nURL=${baseLink}\nIcon=utilities-terminal\n`;
    downloadFile('Fractal Project.desktop', content);
  };

  const downloadRedirectFile = () => {
    const longLink = (shareUrl.includes('#h:') ? shareUrl : fullUrl) || '';
    if (!longLink || !longLink.includes('#h:')) { showToast('Full link not ready yet', { type: 'error' }); return; }
    const safeLink = longLink.replace(/"/g, '&quot;');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>\n<title>Fractal Project Link</title>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#1e1d26;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center}a{color:#7fffd4}code{background:#2c2a3b;padding:.25rem .4rem;border-radius:4px;font-size:.85em}</style></head><body>\n<h1>Opening Fractal Project…</h1>\n<p>If you are not redirected automatically, <a id="redir" href="${safeLink}">click here</a>.</p>\n<p style="font-size:12px;opacity:.6">This HTML file just redirects to a self-contained Fractal hash link.<br/>You can inspect its source safely.</p>\n<script>const target="${safeLink}";try{location.replace(target);}catch{location.href=target;}</script>\n</body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      const idPart = longLink.split('#h:')[1]?.slice(0,12).replace(/[^A-Za-z0-9_-]/g,'') || 'fractal';
      a.download = `fractal-link-${idPart}.html`;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      showToast('Redirect file downloaded', { type: 'success' });
    } catch {
      showToast('Download failed', { type: 'error' });
    }
  };

  const urlTabDisabled = gistNeeded && !shareUrl;

  const markdownSnippet = shareUrl ? `[![Explore in Fractal](${window.location.origin}/badge.svg)](${shareUrl})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans px-3" onClick={onClose}>
      <div className="bg-[#2c2a3b] rounded-xl p-6 w-full max-w-xl shadow-2xl border border-white/10 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white/90">Share Project</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-white/70"/></button>
        </div>
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex gap-2 text-xs font-medium">
            <button onClick={() => !urlTabDisabled && setMode('url')} className={`px-3 py-2 rounded-md border ${mode==='url' ? 'bg-aquamarine text-tuna border-aquamarine' : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'} ${urlTabDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>URL (≤10MB)</button>
            <button onClick={() => setMode('gist')} className={`px-3 py-2 rounded-md border ${mode==='gist' ? 'bg-aquamarine text-tuna border-aquamarine' : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'}`}>Gist (&gt;10MB)</button>
            <button onClick={() => setMode('badge')} className={`px-3 py-2 rounded-md border ${mode==='badge' ? 'bg-aquamarine text-tuna border-aquamarine' : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'} ${!isShareable?'opacity-40 cursor-not-allowed':''}`}>Markdown Badge</button>
          </div>

          {mode === 'gist' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-yellow-300/90 bg-yellow-400/10 p-3 rounded-md">
                {gistNeeded ? 'Your project exceeds the URL size limit. Create a public GitHub Gist.' : 'Optionally create a short Gist-based link.'}
              </p>
              <div className="flex flex-col gap-2">
                {githubToken ? (
                  <div className="text-xs text-emerald-300/80 flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/30">GitHub Connected</span>
                    <button onClick={async () => {
                      const ok = await showConfirm('Disconnect GitHub integration? You can reconnect later.', 'Disconnect GitHub');
                      if (ok) useAuthStore.getState().setGithubToken(null);
                    }} className="text-white/60 hover:text-white/90">Disconnect</button>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2 rounded-md bg-white/10 text-white/40 text-xs w-fit cursor-not-allowed select-none" title="GitHub OAuth integration is temporarily disabled while in progress.">
                      GitHub Connect (Disabled)
                    </div>
                    <div className="text-[10px] text-white/40">Paste a Personal Access Token (PAT) if you already have one:</div>
                    <input id="pat-input" type="password" value={pat} onChange={(e) => setPat(e.target.value)} className="w-full bg-[#22202d] border border-white/10 rounded-md px-3 py-2 text-white/80 font-mono text-sm" placeholder="ghp_..."/>
                    <Link href="https://github.com/settings/tokens/new?scopes=gist&description=Fractal%20Gist%20Token" target="_blank" className="text-[11px] text-aquamarine/80 hover:underline">Create PAT with gist scope</Link>
                  </>
                )}
              </div>
            </div>
          ) : mode === 'url' ? (
            <div className="bg-[#22202d] rounded-md p-3 min-h-[96px] flex flex-col gap-3 text-sm font-mono border border-white/10 w-full">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              ) : (
                <>
                  <textarea
                    readOnly
                    value={shareUrl}
                    className="w-full h-full min-h-[64px] resize-none bg-transparent text-aquamarine font-mono text-[12px] outline-none overflow-y-auto whitespace-pre-wrap break-words" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button onClick={downloadHtmlRedirect} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[10px]">HTML</button>
                    <button onClick={downloadWindowsUrl} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[10px]">Windows .url</button>
                    <button onClick={downloadMacWebloc} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[10px]">macOS .webloc</button>
                    <button onClick={downloadLinuxDesktop} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[10px]">Linux .desktop</button>
                  </div>
                  <div className="text-[10px] text-white/40 leading-snug">
                    Android: use the HTML file (opens in browser) or copy URL and add to home screen via browser menu.
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
                      <Cloud className="w-4 h-4 text-aquamarine" /> Cloud Short Link (Supabase)
                    </div>
                    {!supabaseEnvPresent && (
                      <div className="text-[11px] text-yellow-300/70 bg-yellow-500/10 p-2 rounded">
                        Supabase keys missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local then restart.
                      </div>
                    )}
                    {gistNeeded && (
                      <div className="text-[11px] text-white/60">Project too large for self-contained hash; use Gist.</div>
                    )}
                    {!sbId && !gistNeeded && supabaseEnvPresent && (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <label className="opacity-70">TTL:</label>
                          <select value={ttl} onChange={e=>setTtl(e.target.value)} className="bg-[#1c1a24] border border-white/10 rounded px-2 py-1 text-[11px] outline-none">
                            <option value="3600">1 hour</option>
                            <option value="86400">1 day</option>
                            <option value="604800">7 days</option>
                            <option value="2592000">30 days</option>
                            <option value="none">No expiry</option>
                          </select>
                          <button onClick={createSupabaseShort} disabled={sbCreating || !isShareable} className="px-3 py-1 rounded bg-aquamarine text-tuna font-semibold text-[11px] hover:bg-aquamarine/90 disabled:opacity-40 flex items-center gap-1">
                            {sbCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                            Create
                          </button>
                        </div>
                        {sbError && <div className="text-[11px] text-red-300/80">{sbError}</div>}
                        <div className="text-[10px] text-white/40">Creates a short #sb: link that resolves to your self-contained hash, stored in your Supabase table.</div>
                      </div>
                    )}
                    {sbId && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input readOnly value={cloudShortUrl} className="flex-1 bg-[#1c1a24] border border-white/10 rounded px-2 py-1 text-[11px] text-aquamarine font-mono" />
                          <button onClick={copyCloudShort} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] flex items-center gap-1">
                            {sbCopying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                            Copy
                          </button>
                          <button onClick={deleteSupabaseShort} className="px-2 py-1 rounded bg-white/10 hover:bg-red-500/30 text-[11px] flex items-center gap-1">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] text-white/40 items-center">
                          <span>{sbExpiry ? `Expires: ${new Date(sbExpiry).toLocaleString()}` : 'No expiry'}</span>
                          <span>{hitCount !== null ? `Hits: ${hitCount}` : ''}</span>
                          <button onClick={refreshHitCount} className="px-2 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px]">Refresh</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-[#22202d] rounded-md p-3 min-h-[140px] flex items-center justify-center text-sm font-mono border border-white/10">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              ) : (
                <textarea readOnly value={markdownSnippet} className="w-full h-full resize-none bg-transparent text-aquamarine font-mono text-[12px] outline-none overflow-y-auto" />
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-end">
            <button className="px-4 py-2 rounded-md bg-white/10 text-white/90 hover:bg-white/20 transition-colors" onClick={onClose}>Close</button>
            {mode === 'gist' ? (
              <button onClick={handleCreateGist} disabled={isLoading || !(githubToken || pat)} className="px-4 py-2 rounded-md bg-aquamarine text-tuna font-semibold hover:bg-aquamarine/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                <span>Create Gist</span>
              </button>
            ) : mode === 'url' ? (
              <>
                <button onClick={() => handleCopy('url')} disabled={!isShareable || isLoading} className="px-4 py-2 rounded-md bg-aquamarine text-tuna font-semibold hover:bg-aquamarine/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {copiedItem === 'url' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copiedItem === 'url' ? 'Copied!' : 'Copy URL'}</span>
                </button>
                <button onClick={downloadRedirectFile} disabled={!isShareable || isLoading} className="px-4 py-2 rounded-md bg-white/15 text-white/90 hover:bg-white/25 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">HTML Link File</button>
                <button onClick={() => handleCopy('markdown')} disabled={!isShareable || isLoading} className="px-4 py-2 rounded-md bg-white/20 text-white/90 hover:bg-white/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {copiedItem === 'markdown' ? <Check className="w-5 h-5 text-aquamarine" /> : <LinkIcon className="w-5 h-5" />}
                  <span>{copiedItem === 'markdown' ? 'Copied!' : 'Copy MD Badge'}</span>
                </button>
              </>
            ) : (
              <button onClick={() => handleCopy('markdown')} disabled={!isShareable || isLoading} className="px-4 py-2 rounded-md bg-aquamarine text-tuna font-semibold hover:bg-aquamarine/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {copiedItem === 'markdown' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copiedItem === 'markdown' ? 'Copied!' : 'Copy Markdown'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}