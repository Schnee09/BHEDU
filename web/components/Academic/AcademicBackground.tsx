'use client';

import React from 'react';

/**
 * AcademicBackground - High Performance Technical Background
 * Pure CSS ambient lighting & grid. Zero JS render loop, zero GPU lag.
 */
export const AcademicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-stone-50 dark:bg-[#080808] transition-colors duration-300">
      {/* Ambient Lighting Gradients (Static CSS - 0ms overhead) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.04] dark:bg-amber-500/[0.03] rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/[0.03] dark:bg-amber-500/[0.02] rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      {/* Subtle Academic Dot Pattern */}
      <div
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
          color: 'rgba(120, 113, 108, 0.3)',
        }}
      />

      {/* Vignette Edge Shading */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};
