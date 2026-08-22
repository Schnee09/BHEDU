'use client';

import React from 'react';

export default function LoadingScreen({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-[#0C0B09] w-full"
      role="status"
      aria-label={message}
    >
      <span className="sr-only">{message}</span>
      <div className="space-y-6 flex flex-col items-center">
        {/* Animated Brand Loader */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-16 h-16 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent" />
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-[0.25em]">
            BH-EDU
          </h2>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
