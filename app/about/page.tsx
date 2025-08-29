"use client";
import { ArrowLeft, Sparkles, Layers, Cpu } from "lucide-react";
import Link from "next/link";
import { motion } from 'framer-motion';

export default function AboutPage() {
  const float = (delay: number) => ({
    initial: { y: 0, opacity: 0 },
    animate: { y: [0,-14,0], opacity: 1, transition: { repeat: Infinity, duration: 6, delay, ease: 'easeInOut' } }
  });
  return (
    <div className="w-full flex justify-center font-sans text-tuna relative">
      {/* Floating fun icons */}
      <motion.div {...float(0.2)} className="hidden md:flex items-center gap-2 absolute -left-8 top-40 text-aquamarine/70">
        <Sparkles className="w-6 h-6" />
      </motion.div>
      <motion.div {...float(1.1)} className="hidden md:flex items-center gap-2 absolute -right-8 top-64 text-aquamarine/60">
        <Layers className="w-7 h-7" />
      </motion.div>
      <motion.div {...float(2.2)} className="hidden md:flex items-center gap-2 absolute left-10 top-96 text-aquamarine/50">
        <Cpu className="w-6 h-6" />
      </motion.div>
      <div className="w-full max-w-4xl px-4 py-16 md:py-24 relative">
        <Link href="/" className="inline-flex items-center gap-2 text-aquamarine hover:underline mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
  <main className="prose lg:prose-xl prose-headings:text-calico text-tuna relative
          prose-p:leading-relaxed prose-li:leading-relaxed
          prose-a:text-tuna prose-a:font-medium prose-a:underline prose-a:decoration-aquamarine/70 hover:prose-a:decoration-aquamarine
          prose-code:bg-tuna/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:text-tuna prose-strong:text-tuna">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }}
            className="relative inline-block"
          >
            About Fractal
            <motion.span
              layoutId="about-underline"
              className="block h-[3px] mt-2 rounded-full bg-gradient-to-r from-aquamarine/20 via-aquamarine to-aquamarine/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1, transition: { delay: 0.4, duration: 0.8 } }}
              style={{ transformOrigin: 'left' }}
            />
          </motion.h1>
          
          <h2>Philosophy</h2>
          <p>
            Fractal was something I built to quench a very specific thirst: being able to send <em>any</em> code, project, or project structure to anyone who has an internet connection and a device (yes, even whatever you’re using right now 😑) without spinning up infrastructure or stuffing everything into a database first. I kind of dodged the whole “store all the code” problem by (mostly) not storing it—never perfectly, but close enough to feel clever for five minutes.
          </p>
          <p>
            Here’s the fun part: the project you share gets compressed and (in many cases) run through a sequence of hashes (SHA‑256 involved) and then baked straight into the URL fragment. Yep—your project lives <strong>in the link</strong>. That sounds way cooler than it feels at 2:47 AM when it refuses to decode, but still—pretty satisfying. Making that work was a whole different story from just daydreaming about it.
          </p>
          <p>
            I was <span aria-label="this close" title="this close">this close 🫸🫷</span> to crossing over from “My code doesn’t work… I don’t know why” to the far more dangerous “My code works… I don’t know why!!!”. Jokes aside, building Fractal was a genuinely fun grind. Each new project teaches me fresh, inventive ways to roast my past self for the blunders I shipped. Then I raise my own bar again and chase it. Repeat. That loop weirdly keeps the internal fire satisfied.
          </p>
          <p>
            The project was always meant to be open source the moment it existed in my head. Another factor: I’m broke most of the time and I want everyone (okay, also me 😊) to have access to what I build while keeping the running costs minimal—or free when possible.
          </p>
          <p>
            How it actually behaves in practice: a full <code>#h:</code> link embeds the compressed payload right in the fragment; only the receiving browser touches it. If you opt for a <strong>short link</strong> (<code>#sb:</code>) I store a tiny record (id + compressed blob + optional expiry + hit count) in Supabase so the short redirect works. I don’t expand or analyze your code there—it’s just an opaque string until a browser inflates it. Huge project? Use a public GitHub Gist instead; that goes directly from your browser to GitHub. I also keep the last project in <code>localStorage</code> (<code>fractal:lastProject</code>) so a reload doesn’t nuke everything; clear it anytime.
          </p>

          <h2>Tech Stack</h2>
          <p>
            This project is a testament to the power of modern web technologies. It is built with:
          </p>
          <ul>
            <li><strong>Framework:</strong> Next.js 14 (App Router)</li>
            <li><strong>Languages:</strong> TypeScript</li>
            <li><strong>UI:</strong> React, Tailwind CSS</li>
            <li><strong>Code Editor:</strong> Monaco Editor</li>
            <li><strong>AST Parsing:</strong> Tree-sitter (via WebAssembly)</li>
            <li><strong>State Management:</strong> Zustand</li>
            <li><strong>Animation:</strong> Framer Motion</li>
            <li><strong>Icons:</strong> Lucide React</li>
          </ul>

          <h2>License</h2>
          <p>
            MIT License. Do what you want (within reason). If you improve something, consider sharing—it helps future me (and you).
          </p>

          <h2>Data & Transparency (Quick Recap)</h2>
          <ul>
            <li><strong>Default usage:</strong> Everything happens in your browser.</li>
            <li><strong>Full links (#h:):</strong> Entire project compressed into the fragment.</li>
            <li><strong>Short links (#sb:):</strong> Stored compressed blob + tiny metadata in Supabase.</li>
            <li><strong>Gists:</strong> Optional, public, GitHub‑hosted.</li>
            <li><strong>No analytics:</strong> I’m not tracking you; I have enough tabs already.</li>
          </ul>
        </main>
      </div>
    </div>
  );
}