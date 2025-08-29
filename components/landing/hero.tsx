"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

export function HeroSection() {
  const headline = "Fractal";
  const poeticLine = "See the hidden structure of any code.";
  const subHeadline = "Drag a folder. Explore the tree. Share one link.";

  // The new, more reliable animation variant for the main headline
  const cascadeVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -40, // Start slightly higher
      filter: "blur(10px)", // Start blurry
    },
    visible: {
      opacity: 1,
      y: 0, // Settle at its final position
      filter: "blur(0px)", // Become sharp
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 1.5, // A slightly longer, more graceful animation
        delay: 0.2,
      },
    },
  };

  // Variants for the other page elements to animate in sequentially
  const itemVariants = (delay: number): Variants => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
        delay,
      },
    },
  });

  const [showIntro, setShowIntro] = useState(true);
  const [scrolledIn, setScrolledIn] = useState(false);
  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // fade the intro overlay then reveal headline
    const t = setTimeout(() => setShowIntro(false), 900);
    // Request a mask refresh in case we navigated back from another page
    try {
      window.dispatchEvent(new Event('fractal:wave-mask-refresh'));
    } catch { /* ignore */ }
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!h1Ref.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setScrolledIn(true); });
    }, { root: null, threshold: 0.6 });
    obs.observe(h1Ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!h1Ref.current) return;
    // Capture initial viewport height to avoid mobile URL bar resize causing jumpy animation.
    const initialVH = window.innerHeight;
    const initialVHRef = { current: initialVH };
    let ticking = false;
    const compute = () => {
      if (!h1Ref.current) return;
      const rect = h1Ref.current.getBoundingClientRect();
      // Use stored initialVH for consistent range.
      const start = initialVHRef.current * 0.9;
      const end = initialVHRef.current * 0.15;
      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      setScrollProgress(p);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { compute(); ticking = false; });
    };
    // Handle real orientation / large resize events separately (debounced) to recompute baseline.
    let resizeTO: any = null;
    const onResize = () => {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(() => {
        // Only update baseline if change is large (>120px) to ignore URL bar hide/show.
        if (Math.abs(window.innerHeight - initialVHRef.current) > 120) {
          initialVHRef.current = window.innerHeight;
          compute();
        }
      }, 180);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTO);
    };
  }, []);

  return (
  <div className="relative z-0 flex flex-col items-center text-center mt-4 md:mt-0">
      {/* Intro overlay: covers the page at load and then fades out to reveal the beach */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          pointerEvents: 'none',
          transition: 'opacity 900ms ease-out, backdrop-filter 900ms ease-out',
          opacity: showIntro ? 1 : 0,
          backdropFilter: showIntro ? 'blur(18px) saturate(1.1)' : 'blur(0px) saturate(1)',
          background: showIntro ? 'linear-gradient(180deg, rgba(225,198,153,0.9), rgba(26,188,156,0.05))' : 'transparent',
        }}
      />
      {/* The h1 now animates as a single, reliable block */}
      <motion.h1
        ref={h1Ref}
        data-wave-mask
        className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-1 text-balance leading-[0.9]"
        style={{
          background: "linear-gradient(180deg, #1abc9c 0%, #e1c699ff 150%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          // Slightly reduce vertical travel so it sits higher earlier on mobile
          transform: `translate3d(0, ${(1 - scrollProgress) * 28}px, 0)`,
          filter: `blur(${(1 - scrollProgress) * 8}px)`,
          willChange: 'transform, filter',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased'
        }}
        variants={cascadeVariants}
        initial="hidden"
  animate={showIntro ? "hidden" : (scrolledIn ? "visible" : "hidden")}
        aria-label={headline}
      >
        {headline}
      </motion.h1>

      {/* Poetic line with its own delayed animation */}
  <motion.p
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mt-2 relative z-30"
        data-wave-mask
        id="mask-poetic"
  variants={itemVariants(0.8)} // Increased delay to follow the main headline
  initial="hidden"
  animate={showIntro ? "hidden" : "visible"}
  style={{
    background: "linear-gradient(90deg, #fff 0%, #e1c699 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 16px #fff8, 0 0 4px #e1c69988",
    opacity: Math.max(0, (scrollProgress - 0.25) / 0.75),
  }}
      >
        {poeticLine}
      </motion.p>

      {/* Subheadline with original styling and its own delay */}
      <motion.p
        className="text-lg md:text-xl lg:text-2xl text-tuna/70 mb-10 max-w-3xl text-balance relative z-30"
        data-wave-mask
        variants={itemVariants(1.0)} // Increased delay
  initial="hidden"
  animate={showIntro ? "hidden" : "visible"}
  style={{ opacity: Math.max(0, (scrollProgress - 0.45) / 0.55) }}
      >
        <span
          id="mask-sub"
          data-wave-mask
          className="block relative z-30"
          style={{ willChange: 'clip-path', display: 'inline-block' }}
        >
          {subHeadline}
        </span>
      </motion.p>

      {/* Button with original styling and its own delay */}
      <motion.div
        variants={itemVariants(1.2)} // Increased delay
        initial="hidden"
        animate={showIntro ? "hidden" : "visible"}
        className="relative z-50"
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Link
          href="/editor"
          className="inline-block bg-aquamarine text-tuna font-bold py-4 px-10 rounded-lg text-lg shadow-lg shadow-aquamarine/30 transition-shadow duration-300 ease-in-out hover:shadow-xl hover:shadow-aquamarine/50 focus:outline-none focus:ring-4 focus:ring-aquamarine/50"
        >
          Open the Editor
        </Link>
      </motion.div>
    </div>
  );
}