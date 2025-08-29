<div align="center">

<!-- LOGO AREA -->
<img src="./Fractal-logo.jpeg" alt="Fractal Logo" width="180" />

### Fractal
<strong>Share an entire mini repository in a single link — everything lives in the URL hash.</strong>

[Live Site](https://YOUR-LIVE-URL-HERE) · [How It Works](#-how-it-works) · [FAQ](#-faq) · MIT

<br/>

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Client-Side Only](https://img.shields.io/badge/Data-Stays%20Local-success)
![Multi‑Language](https://img.shields.io/badge/Langs-15%2B-informational)
![Zero Backend](https://img.shields.io/badge/Server-Roundtrip%200-purple)

</div>

## ✨ Overview
Fractal is a website for creating and sharing tiny self‑contained code workspaces. You build a file/folder structure, write code (multiple languages), inspect syntax trees, and then distribute the whole thing as a single URL. Visit that link and the exact project is reconstructed instantly — no archive downloads, no database lookup, no server fetch.

Why? To make teaching, debugging, discussing, and showcasing code frictionless.

## 🧭 Core User Flow
1. Open the site and enter the editor.
2. Create folders / files in the file tree.
3. Write code in Monaco-powered tabs (TS, JS, Python, Rust, Go, C, etc.).
4. (Optional) Open the AST panel to explore the parsed syntax tree via Tree‑sitter.
5. Click Share → a compressed hash (`#h:...`) appears in the URL bar automatically.
6. Copy the URL, send to someone. They open it; the workspace rehydrates locally.
7. (Optional) Shorten the hash (Supabase) or export as a GitHub Gist for permanence.

## 🪄 What Makes It Different
- [ Nearly Zero backend :) ] Everything necessary is inside the fragment after `#` (browsers do not send it to servers, except for making the short link which has partial server needs).
- Multi-language AST exploration: see how real parsers structure your code.
- Visual export: generate a PNG of pretty code panels for docs/social.
- Privacy by default: unless you press buttons for Gist / Shorten, nothing leaves your device.

## � URL Anatomy
```
https://fractal.very-expensive-domain.com/editor#h:<base64url-brotli-packed-project>
				                                 │
				                                 └─ starts with h: (hash pack). Alternative: #sb:<id> (short link)
```

Short link flow:
```
#h:<veryLongPayload>  --(optional shorten)-->  #sb:XYZ123
Browser loads #sb:XYZ123 → calls /api/shorten?id=XYZ123 → swaps back to #h:... (now self-contained)
```

## 🧪 Inside the Browser (How It Works)
1. Virtual file tree (names, modes, contents) is linearized into a compact binary stream.
2. Contents are UTF‑8, small heuristics decide placeholder vs inline for non-text.
3. Stream compressed (Brotli preferred, fallback Gzip) to minimize size.
4. Compressed bytes base64url encoded → put after `#h:`.
5. On load: reverse steps → rebuild tree → open root tab(s)/UI state.
6. Tree‑sitter WASM parsers load lazily per language when an AST view is opened.

## 🧱 Main UI Elements
| Area | Purpose |
| --- | --- |
| File Tree | Create, rename, delete files & folders (context menu). |
| Tabs Bar | Switch between open files; tracks unsaved state. |
| Editor Pane | Monaco editor (themes, Vim mode via monaco-vim). |
| AST Panel | Hierarchical syntax tree (Tree-sitter) for current file. |
| Share Dialog | Hash length, shorten link, Gist export, copy buttons. |
| Toasts / Dialogs | Feedback and modals via lightweight state stores. |

## 🧠 Supported Languages (Parsing / Highlighting)
Tree‑sitter grammars bundled as WASM: C, C++, Go, Rust, Python, JavaScript, TypeScript, TSX, Bash, HTML, CSS, JSON, YAML, Markdown, PHP, Java, Lua, Ruby (plus easy extension—see below).

## ➕ Adding Another Language (User Perspective)
If your desired language isn't present, you can usually drop a `tree-sitter-<lang>.wasm` file into the `public/parsers/` folder (when self-hosting) and map it in the language configuration. The live hosted version rolls new languages periodically.

## � Practical Limits
- URL length: Some platforms truncate extremely long URLs (Slack previews, certain chat apps). Use short links or Gists for very large packs.
- Binary assets: Large binaries are not fully embedded (represented as placeholders) to keep packs lightweight.
- Not an execution sandbox: Code isn’t run (future experimental feature).

## 🔐 Privacy Model
- Fragment (`#...`) never sent in HTTP requests: server sees only the path.
- No analytics events on file contents (unless you add them yourself while self‑hosting).
- Sharing is explicit; closing the tab leaves no remote trace.

## 🧾 FAQ
**Q: Can I collaborate in real time?**  Not yet. Real-time presence (CRDT) is a roadmap idea.

**Q: Can I execute code?**  Execution is out of scope for now; Fractal focuses on structure, sharing, and AST insight.

**Q: How big can a project be?**  Practically a few hundred KB compressed before URLs become unwieldy(10MB is a safe limit); beyond that use Gist export(max 300MB).

**Q: Why not just a Pastebin?**  Fractal preserves full directory structure + multi-file relationships, not just a single blob. And I like moulding new and intresting way to do things.

**Q: Are ASTs cached?**  Parsers load per language; AST is regenerated when the file changes (lightweight for typical snippet sizes).

## 🛠 For Curious Technologists
```
pack() → varint-coded metadata + file headers + content slices
	→ Brotli (Q ~5-8 configurable) with fallback Gzip
	→ base64url (no padding) → #h:<payload>
```
Shortening stores only the base64url payload keyed by a short id in a Supabase table (optional). Gist export uploads a reconstructed textual form (one file per gist entry) and returns a gist ID which is then referenced or imported.

## 📝 License
MIT — do anything productive & kind. See `LICENSE`.

## � Acknowledgements
Next.js · Monaco Editor · Tree‑sitter · Supabase · Brotli & Gzip ecosystems · Open source community.

---

### Developer Appendix (Optional)
<details>
<summary>Open for local development & contribution details</summary>

Clone & run:
```bash
git clone https://github.com/AtharvRG/fractal.git
cd fractal
npm install
npm run dev
```

Environment (optional):
```
GITHUB_CLIENT_ID=... (Didn't implement yet!)
GITHUB_CLIENT_SECRET=... (In Progress)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Tests:
```bash
npm test
```

Build:
```bash
npm run build && npm start
```

Contribution ideas: new parser WASMs, AST UI enhancements, compression tweaks, collaborative layer prototype.

</details>

---

Made with curiosity, compression, and a sprinkle of fractal geometry. 🌀
