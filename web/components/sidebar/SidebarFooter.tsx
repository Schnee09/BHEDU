'use client';

import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  onLogout: () => void;
  isCollapsed: boolean;
}

export function SidebarFooter({ onLogout, isCollapsed }: SidebarFooterProps) {
  return (
    <div className="p-5 mt-auto border-t border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/2 backdrop-blur-sm">
      <button
        onClick={onLogout}
        aria-label="Đăng xuất"
        className={cn(
          'flex items-center gap-3 w-full px-3 py-3 rounded-2xl group transition-all hover:bg-red-500/5 active:scale-95',
          isCollapsed && 'justify-center px-0'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 shadow-sm flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 group-hover:shadow-lg group-hover:shadow-red-500/20 transition-all duration-300">
          <LogOut size={18} />
        </div>
        {!isCollapsed && (
          <span className="font-black text-[11px] text-red-500 uppercase tracking-[0.15em] group-hover:text-red-600 transition-colors">
            Đăng xuất
          </span>
        )}
      </button>
    </div>
  );
}
