"use client";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="w-full flex justify-center font-sans text-tuna relative">
      <motion.div
        initial={{ rotate: -12, scale: 0, opacity: 0 }}
        animate={{ rotate: [ -12, 10, -8, 5, 0], scale: 1, opacity: 0.25 }}
        transition={{ duration: 3.8, ease: 'easeInOut' }}
        className="hidden md:block absolute -right-16 top-40 text-aquamarine pointer-events-none"
      >
        <Shield className="w-40 h-40" />
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
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 18 } }}
            className="relative inline-block"
          >
            Privacy Policy for Fractal
            <motion.span
              className="block h-[3px] mt-2 rounded-full bg-gradient-to-r from-aquamarine/20 via-aquamarine to-aquamarine/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1, transition: { delay: 0.45, duration: 0.9 } }}
              style={{ transformOrigin: 'left' }}
            />
          </motion.h1>
          <p className="text-tuna/60">Last updated: August 29, 2025</p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            viewport={{ once: true, amount: 0.5 }}
          >Core Principle</motion.h2>
            <p>
            I built Fractal so your code stays in your brow...Wow you seriously want me go with all this yapping again? Check this in the <Link href="/about" className="text-aquamarine hover:underline">About</Link> section.
            </p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05 } }}
            viewport={{ once: true, amount: 0.5 }}
          >How It Works</motion.h2>
          <ul>
            <li><strong>Local Processing:</strong> Files you drop in stay local. No silent uploads.</li>
            <li><strong>Full URL Share (<code>#h:</code>):</strong> Entire project lives inside the fragment. Servers ignore fragments; only the opener’s browser inflates it.</li>
            <li><strong>Short Links (<code>#sb:</code>):</strong> I store: id, compressed blob, optional expiry, hit count. I don’t expand or inspect the blob on the server.</li>
            <li><strong>GitHub Gist:</strong> Optional and public. Sent straight from your browser to GitHub. Public means searchable. Triple‑check secrets.</li>
            <li><strong>Local Persistence:</strong> Last project cached in <code>localStorage</code> (<code>fractal:lastProject</code>). Delete it anytime.</li>
          </ul>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05 } }}
            viewport={{ once: true, amount: 0.5 }}
          >Analytics & Tracking</motion.h2>
          <p>
            <strong>(My laptop is already on life support after everything I put it through—what else do you think I’d do with YOUR data?)</strong>. Ahem! If that ever changes I’ll list the exact fields collected here. Hold me to it. And...I never want to Track or collect any personal data or data in itself.
          </p>
          <h2>Your Choices</h2>
          <ul>
            <li>Prefer full <code>#h:</code> links for zero server footprint.</li>
            <li>Skip short links if &quot;stored anywhere&quot; is a no‑go for you.</li>
            <li>Sanity‑scan a Gist before pushing; it&apos;s public instantly.</li>
            <li>Clear browser storage to purge the cached project.</li>
          </ul>
          <h2>Data Removal</h2>
          <p>Delete a short link with a <code>DELETE /api/shorten?id=&lt;id&gt;</code> request. It’s gone as soon as the call returns 200, or use the <code>Delete</code> button in the UI (Where? In the share Dialog box, the moment you make the URL).</p>
          <h2>Contact</h2>
          <p>Questions, doubts, mild panic? Open an issue. I’d rather ship clear, boring facts than spray marketing glitter.</p>
        </main>
      </div>
    </div>
  );
}