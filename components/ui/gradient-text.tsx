"use client";
import React from 'react';
import '@/app/gradient-text.css';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number; // seconds
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = '',
  colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
  };
  return (
    <span className={`animated-gradient-text ${className}`}> {/* inline span for word usage */}
      {showBorder && <span className="gradient-overlay" style={gradientStyle} />}
      <span className="text-content" style={gradientStyle}>{children}</span>
    </span>
  );
}