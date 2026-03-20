'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useScroll } from 'framer-motion';

/**
 * AcademicBackground - A professional, technical background for educational contexts.
 * Focuses on clarity, structure, and subtle premium depth.
 */
export const AcademicBackground: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate stable fragment properties once
  const fragments = React.useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        duration: 15 + Math.random() * 25,
        width: 30 + Math.random() * 50,
      })),
    []
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background dark:bg-[#050505] transition-colors duration-500"
    >
      {/* ... rest unchanged ... */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(circle_at_0%_0%,var(--color-primary),transparent_40%),radial-gradient(circle_at_100%_100%,var(--color-gold-accent),transparent_40%)]" />

      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[radial-gradient(circle_at_100%_0%,var(--color-red-600),transparent_30%)]" />

      {/* Subtle Ambient Depth */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -80, 80, 0],
          y: [0, 60, -60, 0],
          opacity: [0.03, 0.08, 0.03],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gold-accent/5 rounded-full blur-[150px]"
      />

      {/* Client-side design elements - Wrapped in a stable container to preserve hydration structure */}
      <div className="absolute inset-0 pointer-events-none">
        {isMounted && fragments.map((f) => <DataFragment key={f.id} {...f} />)}
      </div>

      {/* Focus Vignette - Position fixed relative to siblings */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
};

interface FragmentProps {
  id: number;
  x: number;
  y: number;
  rotation: number;
  duration: number;
  width: number;
}

const DataFragment = React.memo<FragmentProps>(({ x, y, rotation, duration, width }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        y: [0, -80, 0],
        x: [0, 40, 0],
        rotate: [rotation, rotation + 90],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute glass-crystal"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}px`,
        height: `1px`,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  );
});
DataFragment.displayName = 'DataFragment';
