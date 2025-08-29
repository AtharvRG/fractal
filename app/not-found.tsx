"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// A simple SVG of a branching fractal-like structure
const FractalSVG = () => (
  <motion.svg
    width="150"
    height="150"
    viewBox="0 0 100 100"
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="text-tuna/50"
  >
    <motion.line
      x1="50" y1="100" x2="50" y2="70"
      stroke="currentColor" strokeWidth="3"
      variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
      transition={{ duration: 0.5 }}
    />
    <Branch x={50} y={70} angle={-90} length={30} depth={5} />
  </motion.svg>
);

const Branch = ({ x, y, angle, length, depth }: { x: number, y: number, angle: number, length: number, depth: number }) => {
  if (depth === 0) return null;

  const endX = x + length * Math.cos(angle * Math.PI / 180);
  const endY = y + length * Math.sin(angle * Math.PI / 180);

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5, delay: (6 - depth) * 0.2 } }
  };
  
  const hoverVariants = {
    hover: {
      strokeWidth: 4,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      <motion.line
        x1={x} y1={y} x2={endX} y2={endY}
        stroke="currentColor" strokeWidth="3"
        variants={{ ...lineVariants, ...hoverVariants }}
      />
      <Branch x={endX} y={endY} angle={angle - 25} length={length * 0.75} depth={depth - 1} />
      <Branch x={endX} y={endY} angle={angle + 25} length={length * 0.75} depth={depth - 1} />
    </>
  );
};


export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <FractalSVG />
      <h1 className="mt-8 text-4xl md:text-5xl font-bold text-tuna">
        This branch doesn’t exist. 
      </h1>
      <p className="mt-4 text-lg text-tuna/70">
        How the hell did you end up here btw?
      </p>
      <Link href="/"
        className="mt-10 inline-block bg-aquamarine text-tuna font-bold py-3 px-8 rounded-lg text-lg shadow-lg shadow-aquamarine/30 transition-transform duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-aquamarine/50"
      >
        Go Home
      </Link>
    </div>
  );
}