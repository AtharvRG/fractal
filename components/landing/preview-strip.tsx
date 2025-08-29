"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef, useMemo } from 'react';
import GradientText from '@/components/ui/gradient-text';

export function PreviewStrip() {
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: stickyRef, offset: ['start end', 'end start'] });
  // Staggered reveal segments (start,end) pairs in scroll progress space
  // Fixed segment descriptors (start, end, text, accent?)
  const segments = useMemo(() => ([
    { range: [0.00, 0.22] as [number, number], text: 'Between you and me...', accent: false },
    { range: [0.14, 0.36] as [number, number], text: 'this is what', accent: false },
    { range: [0.28, 0.50] as [number, number], text: 'you\u2019ll see inside', accent: false },
    { range: [0.42, 0.64] as [number, number], text: 'Fractal.', accent: true },
    { range: [0.42, 0.64] as [number, number], text: '\ud83d\udc47', accent: false },
  ]), []);
  // Call hooks explicitly per segment index (constant length keeps order stable)
  const opacity0 = useTransform(scrollYProgress, segments[0].range, [0, 1]);
  const opacity1 = useTransform(scrollYProgress, segments[1].range, [0, 1]);
  const opacity2 = useTransform(scrollYProgress, segments[2].range, [0, 1]);
  const opacity3 = useTransform(scrollYProgress, segments[3].range, [0, 1]);
  const opacity4 = useTransform(scrollYProgress, segments[4].range, [0, 1]);
  const y0 = useTransform(scrollYProgress, segments[0].range, [28, 0]);
  const y1 = useTransform(scrollYProgress, segments[1].range, [28, 0]);
  const y2 = useTransform(scrollYProgress, segments[2].range, [28, 0]);
  const y3 = useTransform(scrollYProgress, segments[3].range, [28, 0]);
  const y4 = useTransform(scrollYProgress, segments[4].range, [28, 0]);
  const b0 = useTransform(scrollYProgress, segments[0].range, [8, 0]);
  const b1 = useTransform(scrollYProgress, segments[1].range, [8, 0]);
  const b2 = useTransform(scrollYProgress, segments[2].range, [8, 0]);
  const b3 = useTransform(scrollYProgress, segments[3].range, [8, 0]);
  const b4 = useTransform(scrollYProgress, segments[4].range, [8, 0]);
  const opacities = [opacity0, opacity1, opacity2, opacity3, opacity4];
  const ys = [y0, y1, y2, y3, y4];
  const blurs = [b0, b1, b2, b3, b4];

  return (
    <motion.div className="w-full max-w-6xl flex flex-col items-center gap-12" style={{ position: 'relative' }}>
      {/* Spacer to ensure sticky text does not overlap hero on smaller viewports */}
  <div className="w-full h-[32vh] md:h-[18vh]" aria-hidden />
      {/* Sticky scroll-reveal sentence */}
      <div className="relative w-full" style={{ minHeight: '60vh' }}>
        <div ref={stickyRef} className="sticky top-24 md:top-32 w-full flex flex-col items-center select-none" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-3 text-center text-[clamp(1.15rem,4.2vw,1.9rem)] font-[500] tracking-tight leading-tight px-4" style={{ fontFamily: 'Raleway, var(--font-sans, sans-serif)' }}>
    {segments.map(({ text, accent }, i) => (
              <motion.span
                key={i}
                style={{
      opacity: opacities[i] as any,
      transform: ys[i] && (ys[i] as any).to ? (ys[i] as any).to((v: number) => `translate3d(0, ${v}px, 0)`) : undefined,
      filter: blurs[i] && (blurs[i] as any).to ? (blurs[i] as any).to((b: number) => `blur(${b}px)`) : undefined,
                }}
                className={`transition-[opacity,filter,transform] duration-500 will-change-transform will-change-filter`}
              >
                {accent ? (
                  <GradientText
                    animationSpeed={6}
                    colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                    className="px-1"
                  >{text}</GradientText>
                ) : text}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Preview panel appears after sticky section */}
      <motion.div
        className="w-full max-w-6xl flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.1 }}
        style={{ position: 'relative' }}
      >
      <div className="w-full bg-[#3a384b] rounded-xl border border-white/10 shadow-2xl shadow-tuna/40 flex flex-col">
        {/* Mock Toolbar */}
        <div className="flex items-center p-3 border-b border-white/10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
        </div>

        {/* Mock 3-Pane Editor */}
  <div className="flex flex-col md:grid md:grid-cols-[220px_1fr_300px] h-[350px] md:h-[500px] p-2 gap-2 overflow-x-auto">
          {/* 1. File Tree */}
          <div className="bg-tuna/60 rounded-md p-3 text-sm text-white/60 overflow-auto">
            <p className="font-mono text-white/80 mb-2">src/</p>
            <p className="font-mono pl-2">├─ components/</p>
            <p className="font-mono pl-2 text-aquamarine">│  └─ button.tsx</p>
            <p className="font-mono pl-2">├─ hooks/</p>
            <p className="font-mono pl-2">└─ page.tsx</p>
          </div>
          {/* 2. Code IDE */}
          <div className="bg-tuna/60 rounded-md p-3 font-mono text-sm text-white/60 overflow-auto">
            <span className="text-[#c678dd]">import</span> React <span className="text-[#c678dd]">from</span> <span className="text-[#e5c07b]">&quot;react&quot;</span>;
            <br />
            <span className="text-[#c678dd]">interface</span> <span className="text-[#e06c75]">ButtonProps</span> {'{'}
            <br />&nbsp;&nbsp;<span className="text-[#e5c07b]">label</span>: <span className="text-[#c678dd]">string</span>;
            <br />&nbsp;&nbsp;<span className="text-[#e5c07b]">onClick</span>?: <span className="text-[#c678dd]">() =&gt; void</span>;
            <br />{'}'}
            <br />
            <span className="text-[#61afef]">export const</span> <span className="text-[#e06c75]">Button</span>: React.FC&lt;ButtonProps&gt; = ({`{ label, onClick }`}) =&gt; (
            <br />&nbsp;&nbsp;<span className="text-[#56b6c2]">&lt;button</span> <span className="text-[#e5c07b]">className</span>=<span className="text-[#98c379]">&quot;px-4 py-2 bg-aquamarine text-tuna rounded hover:bg-aquamarine/80&quot;</span> <span className="text-[#e5c07b]">onClick</span>=<span className="text-[#c678dd]">&#123;onClick&#125;</span>&gt;
            <br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#e5c07b]">&#123;label&#125;</span>
            <br />&nbsp;&nbsp;<span className="text-[#56b6c2]">&lt;/button&gt;</span>
            <br />);
          </div>
          {/* 3. AST */}
          <div className="bg-tuna/60 rounded-md p-3 text-sm text-white/60 overflow-auto">
             <p className="font-mono text-white/80">program</p>
             <p className="font-mono pl-2">├─ import_statement</p>
             <p className="font-mono pl-6">└─ identifier: <span className="text-[#e5c07b]">&quot;React&quot;</span></p>
             <p className="font-mono pl-2">├─ interface_declaration: <span className="text-[#e06c75]">ButtonProps</span></p>
             <p className="font-mono pl-2">├─ function_declaration: <span className="text-[#e06c75]">Button</span></p>
             <p className="font-mono pl-6">├─ parameter: <span className="text-[#e5c07b]">label</span></p>
             <p className="font-mono pl-6">├─ parameter: <span className="text-[#e5c07b]">onClick</span></p>
             <p className="font-mono pl-6">└─ jsx_element: <span className="text-[#56b6c2]">button</span></p>
          </div>
        </div>
      </div>

      </motion.div>
    </motion.div>
  );
}