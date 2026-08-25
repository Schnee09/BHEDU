'use client';

import { memo } from 'react';
import Link from 'next/link';
import { LogOut, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';

interface SidebarFooterProps {
  onLogout: () => void;
  isCollapsed: boolean;
}

export const SidebarFooter = memo(function SidebarFooter({
  onLogout,
  isCollapsed,
}: SidebarFooterProps) {
  return (
    <div className="p-3 mt-auto shrink-0 border-t border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/2 backdrop-blur-sm">
      {/* Mobile-only Theme Toggle Row */}
      {!isCollapsed && (
        <div className="lg:hidden flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-stone-100/60 dark:bg-white/5 border border-stone-200/50 dark:border-white/5">
          <span className="font-bold text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Giao diện
          </span>
          <ThemeToggle />
        </div>
      )}

      {/* Landing Page public link */}
      <Link
        href="/"
        title="Về Trang giới thiệu (Landing Page)"
        className={cn(
          'flex items-center gap-2.5 w-full px-2.5 py-1.5 mb-1 rounded-xl group transition-all hover:bg-amber-500/10 active:scale-95 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400',
          isCollapsed && 'justify-center px-0'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-white/10 shadow-2xs flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-200">
          <Globe size={15} />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-[11px] uppercase tracking-wider transition-colors truncate">
            Trang giới thiệu
          </span>
        )}
      </Link>

      {/* Logout button */}
      <button
        onClick={onLogout}
        aria-label="Đăng xuất"
        className={cn(
          'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl group transition-all hover:bg-rose-500/5 active:scale-95 text-rose-600 dark:text-rose-400',
          isCollapsed && 'justify-center px-0'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 shadow-2xs flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-all duration-200">
          <LogOut size={15} />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-[11px] uppercase tracking-wider group-hover:text-rose-700 transition-colors">
            Đăng xuất
          </span>
        )}
      </button>
    </div>
  );
});
