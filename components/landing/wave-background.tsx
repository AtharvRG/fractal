"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';

export function WaveBackground() {
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const maskIntervalId = useRef<number>();

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const urlParams = useMemo(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null), []);
  const wavesDisabledByParam = urlParams?.get('waves') === 'off';
  const wavesDisabledByStorage = typeof window !== 'undefined' && localStorage.getItem('wavesDisabled') === '1';
  const disableWaves = prefersReducedMotion || wavesDisabledByParam || wavesDisabledByStorage;

  const createAnimation = useCallback(() => {
    if (disableWaves) return;

    const backCanvas = backCanvasRef.current;
    const frontCanvas = frontCanvasRef.current;
    if (!backCanvas || !frontCanvas) return;

  const backCtx = backCanvas.getContext('2d');
  const frontCtx = frontCanvas.getContext('2d');
    if (!backCtx || !frontCtx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastWidth = width; // <-- Track the last known width

    const isChromium = /Chrome/.test(navigator.userAgent) && !/Edg|OPR|Opera/.test(navigator.userAgent);
    const isMobile = width < 600 || /Mobi|Android/i.test(navigator.userAgent);

  const applyDPR = () => {
      const raw = window.devicePixelRatio || 1;
      const dpr = isChromium ? Math.min(1.5, raw) : Math.min(2, raw);
      [backCanvas, frontCanvas].forEach(canvas => {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };

  // --- Configuration ---
    const SHORELINE_Y = isMobile ? height * 0.42 : height * 0.55;
    const RUNUP_MAX = isMobile ? 100 : 150;
    const PERIOD = isMobile ? 4200 : 6000;
    const WET_SAND_RECEDE_DURATION = isMobile ? 1300 : 2000;
    const WATER_BAND_MIN = isMobile ? 16 : 20;
    const WATER_BAND_MAX = isMobile ? 26 : 40;
    const FOAM_WIDTH = isMobile ? 2.2 : 4;
    let STEP = isMobile ? 8 : 12;
    const SHAPE_NOISE_AMP = isMobile ? 6 : 10;
    const SHAPE_NOISE_FREQ = 0.02;
    const SHAPE_NOISE_DRIFT = 0.0007;
    const FOAM_SPECKLE_DENSITY = isChromium ? 0.12 : 0.4;
    const SPARKLE_COUNT = isMobile ? 70 : (isChromium ? 200 : 300);
    // sparkles and bloom tuning
    // fraction of sparkles that get the bloom glow treatment (0..1)
     const BLOOM_PROB = isMobile ? 0.001 : 0.001;
     const DECOR_COUNT = isMobile ? 15 : 30;

     // Sparkle band: vertical range (in px) below the shoreline where sparkles can appear.
     // Override via URL param `?sparkleBand=min,max` (example: ?sparkleBand=6,60)
     const defaultBandMin = isMobile ? 6 : 0;
     const defaultBandMax = isMobile ? 300 : 5000;
     let SPARKLE_BAND_MIN = defaultBandMin;
     let SPARKLE_BAND_MAX = defaultBandMax;
     try {
       const param = typeof window !== 'undefined' ? urlParams?.get('sparkleBand') : null;
       if (param) {
         const parts = param.split(',').map(p => Number(p.trim()));
         if (!Number.isNaN(parts[0])) SPARKLE_BAND_MIN = Math.max(0, parts[0]);
         if (!Number.isNaN(parts[1])) SPARKLE_BAND_MAX = Math.max(SPARKLE_BAND_MIN + 1, parts[1]);
       }
  } catch (_) { /* ignore parse errors */ }

    // --- Colors ---
    const WATER_TOP = 'rgba(26, 188, 156, 0.16)';
    const WATER_BOTTOM = 'rgba(26, 188, 156, 0.28)';
    const WET_SAND = 'rgba(110, 85, 50, 0.10)';
    const FOAM_COLOR = 'rgba(255,255,255,0.9)';

    // --- Utilities ---
    const smoothstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
    const noise1 = (x: number) => { const i = Math.floor(x); const f = x - i; return hash(i) + (hash(i + 1) - hash(i)) * (f * f * (3 - 2 * f)); };
    const fbm1 = (x: number) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { v += a * noise1(x * f); a *= 0.5; f *= 2; } return v; };
    const getRunup = (t: number) => Math.pow(smoothstep(0, 1, 1 - Math.abs(2 * (t % PERIOD) / PERIOD - 1)), 1.15);
    const waveY = (x: number, t: number) => SHORELINE_Y - getRunup(t) * RUNUP_MAX + (fbm1(x * SHAPE_NOISE_FREQ + t * SHAPE_NOISE_DRIFT) - 0.5) * 2 * SHAPE_NOISE_AMP;

  // --- Scene Objects & State ---
  type Decor = { kind: 'shell' | 'star' | 'pebble' | 'seaweed' | 'footprint'; x: number; y: number; rot: number; scale: number; color: string };
  type Sparkle = { x: number; y: number; r: number; baseR: number; phase: number; drift: number; depth: number; bobAmp: number; bobSpeed: number; bloom?: boolean };
    let decors: Decor[] = [], sparkles: Sparkle[] = [];
    let maskEls: HTMLElement[] = [];
    type WavePhase = 'advancing' | 'sticking' | 'catching_up' | 'receding';
    let wavePhase: WavePhase = 'advancing';
    let peakTime = 0, catchUpStartTime = 0, lastRun = 0;
    let wetSandMaxY: number[] = [];

    const initScene = () => {
      decors = [];
      sparkles = [];
      const sandBottom = SHORELINE_Y - RUNUP_MAX - SHAPE_NOISE_AMP - 16;
      // helper to approximate collision radius per kind
      const getRadius = (kind: Decor['kind'], scale: number) => {
        switch (kind) {
          case 'pebble': return 8 * scale;
          case 'shell': return 10 * scale;
          case 'star': return 12 * scale;
          case 'seaweed': return 12 * scale;
          case 'footprint': return 14 * scale;
          default: return 8 * scale;
        }
      };

      for (let i = 0; i < DECOR_COUNT; i++) {
        // introduce seaweed and footprint occasionally
        const r = Math.random();
        let kind: Decor['kind'] = 'pebble';
        if (r < 0.08) kind = 'star';
        else if (r < 0.35) kind = 'shell';
        else if (r < 0.55) kind = 'seaweed';
        else if (r < 0.62) kind = 'footprint';
        else kind = 'pebble';

        let placed = false;
        let attempts = 0;
        let x = 0, y = 0, rot = 0, scale = 1;
        while (!placed && attempts < 40) {
          x = Math.random() * width;
          y = Math.max(height * 0.02, Math.min(sandBottom - 8, height * 0.02 + Math.random() * (sandBottom - height * 0.02)));
          rot = Math.random() * Math.PI * 2;
          scale = (kind === 'star' ? 0.6 : 0.8) + Math.random() * 0.6;

          const rThis = getRadius(kind, scale);
          // basic bounds check
          if (x - rThis < 0 || x + rThis > width) { attempts++; continue; }

          let collision = false;
          for (const ex of decors) {
            const rOther = getRadius(ex.kind, ex.scale);
            const dx = ex.x - x;
            const dy = ex.y - y;
            const minDist = (rThis + rOther) * 0.9; // slight padding factor
            if (dx * dx + dy * dy < minDist * minDist) { collision = true; break; }
          }

          if (!collision) placed = true;
          attempts++;
        }

        // fallback: accept last position even if overlapping after attempts
        const color = kind === 'pebble' ? 'rgba(90,80,60,0.6)' : (kind === 'star' ? '#f1b36a' : (kind === 'seaweed' ? 'rgba(30,120,70,0.9)' : '#f2e7c9'));
        decors.push({ kind, x, y, rot, scale, color });
      }
      const depthAvail = Math.max(60, height - (SHORELINE_Y + 80));
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        const baseR = (isMobile ? 0.4 : 0.5) + Math.random() * 1.7;
        // reduce minimum sparkle depth on mobile so there's no big gap below the shoreline
    const minDepth = SPARKLE_BAND_MIN;
    const maxCap = SPARKLE_BAND_MAX;
        const depth = minDepth + Math.random() * Math.max(6, Math.min(maxCap, depthAvail) - minDepth);
    sparkles.push({ x: Math.random() * width, y: SHORELINE_Y + depth, r: baseR, baseR, phase: Math.random() * Math.PI * 2, drift: (Math.random() - 0.5) * 0.6, depth, bobAmp: 3 + Math.random() * 5, bobSpeed: 0.001 + Math.random() * 0.002, bloom: Math.random() < BLOOM_PROB });
      }
    };

    // Add subtle sand texture (tiny speckles) under decorations to make beach look less flat
    const drawSandTexture = (ctx: CanvasRenderingContext2D) => {
      const grainCount = Math.floor(width * (isMobile ? 0.06 : 0.12));
      ctx.save();
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < grainCount; i++) {
        const gx = Math.random() * width;
        const gy = SHORELINE_Y - RUNUP_MAX + Math.random() * (height - (SHORELINE_Y - RUNUP_MAX));
        const r = Math.random() * (isMobile ? 0.6 : 1.1);
        ctx.fillStyle = `rgba(80,65,45,${0.6 + Math.random() * 0.4})`;
        ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    const drawDecor = (ctx: CanvasRenderingContext2D) => {
      // draw a faint sand texture first
      drawSandTexture(ctx);

      decors.forEach(d => {
        ctx.save();
        // subtle shadow under each element
        ctx.translate(d.x, d.y + (2 * d.scale));
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(0, 2 * d.scale, 6 * d.scale, 3 * d.scale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.scale(d.scale, d.scale);

        if (d.kind === 'pebble') {
          // pebble with subtle gradient + highlight
          const g = ctx.createLinearGradient(-6, -4, 6, 4);
          g.addColorStop(0, 'rgba(90,80,60,0.85)');
          g.addColorStop(1, 'rgba(120,110,90,0.9)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.ellipse(0, 0, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
          // tiny specular
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(-2, -2, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
        } else if (d.kind === 'shell') {
          // more detailed shell with ridges and inner highlight
          ctx.fillStyle = d.color;
          ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-3, -8, 0, -8); ctx.quadraticCurveTo(3, -8, 8, 0); ctx.quadraticCurveTo(0, 5, -8, 0); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8; ctx.beginPath();
          for (let i = -6; i <= 6; i += 2) { ctx.moveTo(i, 0); ctx.quadraticCurveTo(i * 0.4, -3, 0, -6); }
          ctx.stroke();
        } else if (d.kind === 'star') {
          // textured starfish with inner ring
          ctx.fillStyle = d.color;
          ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (Math.PI * 2 * i) / 10; ctx.lineTo(Math.cos(a) * (i % 2 === 0 ? 10 : 5), Math.sin(a) * (i % 2 === 0 ? 10 : 5)); } ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        } else if (d.kind === 'seaweed') {
          // simple seaweed frond
          ctx.strokeStyle = d.color; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-6, 2, -4, -6, 0, -12); ctx.bezierCurveTo(4, -6, 6, 2, 0, 8); ctx.stroke();
        } else if (d.kind === 'footprint') {
          // a simple footprint pair
          ctx.fillStyle = 'rgba(70,55,35,0.32)';
          ctx.beginPath(); ctx.ellipse(-4, 0, 4, 6, -0.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(6, 0, 3, 4.5, 0.1, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
      });
    };

    const updateAndDrawSparkles = (ctx: CanvasRenderingContext2D, t: number) => {
      // Single-pass sparkle renderer: update positions, draw a soft radial glow and a crisp core
      ctx.save();
      // clip to wave area so sparkles don't draw on land
      ctx.beginPath(); ctx.moveTo(0, waveY(0, t));
      for (let x = STEP; x <= width; x += STEP) ctx.lineTo(x, waveY(x, t));
      ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.clip();

      // use 'lighter' so glows additively blend
      ctx.globalCompositeOperation = 'lighter';

      sparkles.forEach(s => {
        // update motion
        s.x += (isMobile ? 0.02 : 0.04) * (1 + s.drift);
        const desiredY = waveY(s.x, t) + s.depth + Math.sin(t * s.bobSpeed + s.phase) * s.bobAmp;
        s.y += (desiredY - s.y) * 0.08;
        s.r = s.baseR * (0.8 + 0.4 * (0.5 + 0.5 * Math.sin(t * (isMobile ? 0.0026 : 0.005) + s.phase)));
        if (s.x < -10) s.x = width + 10; if (s.x > width + 10) s.x = -10;

        // glow if this sparkle has bloom enabled
        if (s.bloom) {
          const inner = Math.max(1, s.r * 0.6);
          const outer = Math.max(6, s.r * (isMobile ? 4 : 6));
          const rg = ctx.createRadialGradient(s.x, s.y, inner, s.x, s.y, outer);
          rg.addColorStop(0, 'rgba(255,255,255,0.9)');
          rg.addColorStop(0.25, 'rgba(255,255,255,0.35)');
          rg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(s.x, s.y, outer, 0, Math.PI * 2); ctx.fill();
        }

        // crisp core (always draw)
        ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.arc(s.x, s.y, Math.max(0.8, s.r * 0.9), 0, Math.PI * 2); ctx.fill();
      });

      ctx.restore();
    };

    // --- MASKING (DECOUPLED & STUTTER-FREE) ---
    const applyClipTo = (el: HTMLElement) => {
      const now = performance.now();
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const pointCount = Math.min(25, Math.max(10, Math.floor(rect.width / 40)));
      const stepPx = rect.width / pointCount;
      const samples: string[] = [];
      for (let i = 0; i <= pointCount; i++) {
        const x = rect.left + (i * stepPx);
        const y = Math.max(0, waveY(x, now) - rect.top);
        samples.push(`${((i * stepPx) / rect.width * 100).toFixed(2)}% ${(y / rect.height * 100).toFixed(2)}%`);
      }
      const poly = `polygon(0% 0%, 100% 0%, ${samples.reverse().join(',')})`;
      if (el.dataset.wavePath !== poly) { el.style.clipPath = poly; (el.style as any)['webkitClipPath'] = poly; el.dataset.wavePath = poly; }
    };

    const startMasking = () => {
      try { maskEls = Array.from(document.querySelectorAll<HTMLElement>('[data-wave-mask]')); } catch { maskEls = []; }
      if (maskEls.length > 0) {
        if (maskIntervalId.current) clearInterval(maskIntervalId.current);
        maskIntervalId.current = window.setInterval(() => {
          maskEls.forEach(applyClipTo);
        }, 40); // ~25fps - smooth and non-blocking
      }
    };
    // Allow other components (like HeroSection) to request a mask refresh after they mount
    const onExternalRefresh = () => {
      // slight delay so freshly mounted elements have layout
      requestAnimationFrame(() => startMasking());
    };
    window.addEventListener('fractal:wave-mask-refresh', onExternalRefresh);

    // --- Main Canvas Animation Loop ---
    const animate = (timestamp: number) => {
      animationFrameId.current = requestAnimationFrame(animate);
      if (document.hidden) return;

      backCtx.clearRect(0, 0, width, height);
      frontCtx.clearRect(0, 0, width, height);
      const grad = backCtx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#e1c699'); grad.addColorStop(1, '#1abc9c');
      backCtx.fillStyle = grad; backCtx.fillRect(0, 0, width, height);
      drawDecor(backCtx);
      updateAndDrawSparkles(frontCtx, timestamp);

  // sparkle rendering is handled by updateAndDrawSparkles (single-pass)

      const runNow = getRunup(timestamp);
      const advancing = runNow > lastRun;
      STEP = Math.max(isMobile ? 8 : 12, Math.floor(width / 100));
      
      const crestPositions: number[] = [];
      const wetSandPositions: number[] = [];
      const pointCount = Math.floor(width / STEP);

      if (advancing && runNow < 0.98) { wavePhase = 'advancing'; }
      if (wavePhase === 'advancing' && runNow >= 0.98) { wavePhase = 'sticking'; peakTime = timestamp; }
      if (wavePhase === 'sticking' && timestamp - peakTime > 500) { wavePhase = 'catching_up'; catchUpStartTime = timestamp; }
      const catchUpElapsed = timestamp - catchUpStartTime;
      const catchUpProgress = Math.min(1, catchUpElapsed / WET_SAND_RECEDE_DURATION);
      if (wavePhase === 'catching_up' && catchUpProgress >= 1) { wavePhase = 'receding'; }
      if (!advancing && runNow < 0.02) { wavePhase = 'advancing'; wetSandMaxY = Array(pointCount + 1).fill(SHORELINE_Y); }
      if (wetSandMaxY.length !== pointCount + 1) wetSandMaxY = Array(pointCount + 1).fill(SHORELINE_Y);

      for (let i = 0; i <= pointCount; i++) {
        const x = i * STEP;
        const crestY = waveY(x, timestamp);
        crestPositions.push(crestY);
        let wetY = crestY;
        switch (wavePhase) {
          case 'advancing': if (crestY < wetSandMaxY[i]) wetSandMaxY[i] = crestY; break;
          case 'sticking': wetY = wetSandMaxY[i]; break;
          case 'catching_up': wetY = wetSandMaxY[i] + (crestY - wetSandMaxY[i]) * catchUpProgress; break;
        }
        wetSandPositions.push(wetY);
      }
      lastRun = runNow;

      // --- DRAWING (Corrected Order) ---
      const bandHeight = WATER_BAND_MIN + runNow * (WATER_BAND_MAX - WATER_BAND_MIN);
      
      frontCtx.beginPath();
      crestPositions.forEach((y, i) => frontCtx.lineTo(i * STEP, y));
      frontCtx.lineTo(width, height); frontCtx.lineTo(0, height); frontCtx.closePath();
      const waterGrad = frontCtx.createLinearGradient(0, SHORELINE_Y - RUNUP_MAX, 0, SHORELINE_Y + bandHeight);
      waterGrad.addColorStop(0, WATER_TOP); waterGrad.addColorStop(1, WATER_BOTTOM);
      frontCtx.fillStyle = waterGrad; frontCtx.fill();

      frontCtx.beginPath();
      wetSandPositions.forEach((y, i) => frontCtx.lineTo(i * STEP, y));
      for (let i = crestPositions.length - 1; i >= 0; i--) { frontCtx.lineTo(i * STEP, crestPositions[i]); }
      frontCtx.closePath();
      frontCtx.fillStyle = WET_SAND; frontCtx.fill();

      frontCtx.lineWidth = FOAM_WIDTH; frontCtx.strokeStyle = FOAM_COLOR;
      frontCtx.beginPath(); crestPositions.forEach((y, i) => frontCtx.lineTo(i * STEP, y)); frontCtx.stroke();

      const tBucket = Math.floor(timestamp / 140);
      crestPositions.forEach((y, i) => {
        const x = i * STEP;
        const seed = x * 0.123 + tBucket * 17.3;
        if (hash(seed) < FOAM_SPECKLE_DENSITY) {
          const speckleY = y + (hash(seed + 5.7) - 0.5) * 6;
          const r = (hash(seed + 2.3) * (isMobile ? 1.3 : 1.8)) + 0.6;
          if (isChromium && r < 0.9) return;
          frontCtx.beginPath();
          frontCtx.arc(x + (hash(seed + 9.9) - 0.5) * STEP, speckleY, r, 0, Math.PI * 2);
          frontCtx.fillStyle = 'rgba(255,255,255,0.85)';
          frontCtx.fill();
        }
      });
    };

    // --- Event Listeners & Cleanup ---
    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<F>): void => { if (timeout) clearTimeout(timeout); timeout = setTimeout(() => func(...args), waitFor); };
    };

    // THE FIX IS HERE
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // Always update canvas dimensions and restart masking
      applyDPR();
      startMasking();
      
      // Only re-generate the scene if the width changes (e.g., phone rotation)
      if (width !== lastWidth) {
        initScene();
      }
      
      lastWidth = width; // Update the tracker
    };

    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    
    applyDPR();
    initScene();
    startMasking();
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('fractal:wave-mask-refresh', onExternalRefresh);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (maskIntervalId.current) clearInterval(maskIntervalId.current);
    };
  }, [disableWaves, urlParams]);

  useEffect(() => {
    const cleanup = createAnimation();
    return () => { if (cleanup) cleanup(); };
  }, [createAnimation]);

  return (
    <>
      {!disableWaves && (
        <>
          <canvas ref={backCanvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -10, pointerEvents: 'none' }} />
          <canvas ref={frontCanvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -5, pointerEvents: 'none' }} />
        </>
      )}
    </>
  );
}