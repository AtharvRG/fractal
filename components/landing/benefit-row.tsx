"use client";

import { motion } from "framer-motion";
import { DownloadCloud, Globe, Share2 } from "lucide-react";
import React from "react";

const benefits = [
  {
    icon: <DownloadCloud className="w-10 h-10 text-aquamarine" />,
    title: "Zero Install",
    description: "No downloads, no setup. Fractal runs entirely in your browser, on any device.",
  },
  {
    icon: <Globe className="w-10 h-10 text-aquamarine" />,
    title: "100% Browser",
    description: "Your code never touches our servers. All processing happens on your machine.",
  },
  {
    icon: <Share2 className="w-10 h-10 text-aquamarine" />,
    title: "Share One Link",
    description: "Compress and encode your entire project into a single shareable URL.",
  },
];

export function BenefitRow() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } },
  };

  return (
    <motion.div
      className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      {benefits.map((benefit, index) => (
        <motion.div
          key={index}
          className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg shadow-tuna/10"
          variants={itemVariants}
          whileHover={{ y: -8, scale: 1.03, transition: { type: 'spring', stiffness: 300, damping: 10 } }}
        >
          <div className="mb-5">{benefit.icon}</div>
          <h3 className="text-xl font-bold text-tuna mb-2">{benefit.title}</h3>
          <p className="text-tuna/70 text-balance">{benefit.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}