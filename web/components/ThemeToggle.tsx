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

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    // Correct toggle: if currently dark (explicit or via system), switch to light, else dark
    setTheme(isDark ? 'light' : 'dark');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-stone-800" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group
        ${isDark
          ? 'bg-[#1C1A16] hover:bg-[#26231E] border border-stone-800 text-amber-400 hover:border-amber-500/40'
          : 'bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 hover:border-amber-500/40'
        }`}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <MoonIcon className="w-5 h-5 text-amber-400 transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
        ) : (
          <SunIcon className="w-5 h-5 text-amber-500 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45" />
        )}
      </div>
    </button>
  );
}
