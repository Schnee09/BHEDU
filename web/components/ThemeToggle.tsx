"use client";

import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { useCustomization } from "@/contexts/CustomizationContext";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useCustomization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-gray-700" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 cursor-pointer group overflow-hidden
        ${isDark
          ? 'bg-[#1C1A16] border border-white/5 shadow-inner'
          : 'bg-stone-100/80 border border-stone-200 shadow-inner'
        }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Chế độ sáng" : "Chế độ tối"}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-xl" />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-xl" />
      </div>

      {/* Sun Icon (Light Mode) */}
      <div className={`absolute transition-all duration-500 ease-out transform
        ${isDark ? 'translate-y-8 opacity-0 rotate-90' : 'translate-y-0 opacity-100 rotate-0'}`}>
        <SunIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
      </div>

      {/* Moon Icon (Dark Mode) */}
      <div className={`absolute transition-all duration-500 ease-out transform
        ${isDark ? 'translate-y-0 opacity-100 rotate-0' : '-translate-y-8 opacity-0 -rotate-90'}`}>
        <MoonIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
      </div>
    </button>
  );
}
