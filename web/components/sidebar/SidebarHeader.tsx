'use client';

import { useEffect, useState, memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getDisplayName } from '@/lib/utils/names';
import { Profile } from '@/contexts/ProfileContext';
import type { UserRole } from '@/lib/auth/core';

interface SidebarHeaderProps {
  profile: Profile;
  isCollapsed: boolean;
}

export const SidebarHeader = memo(function SidebarHeader({ profile, isCollapsed }: SidebarHeaderProps) {
  const [greeting, setGreeting] = useState('Xin chào');
  const role = (profile.role ?? 'student') as UserRole;

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Chào buổi sáng');
    else if (hours < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  return (
    <div className="flex flex-col border-b border-stone-100 dark:border-white/5 pb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Top Status Bar - Interactive */}
      <div className="px-7 py-4 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </div>
              <span className="text-[9px] font-black text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors uppercase tracking-[0.25em]">
                BH-EDU LIVE
              </span>
            </Link>

            <div className="px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-sm backdrop-blur-sm">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">
                HKII-2025
              </span>
            </div>
          </>
        ) : (
          <div className="w-full flex justify-center py-2">
            <div className="relative flex h-2.5 w-2.5" title="System Online">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
          </div>
        )}
      </div>

      {/* Brand Logo & Name */}
      <div
        className={cn(
          'px-7 flex items-center gap-4 transition-all duration-300',
          isCollapsed && 'flex-col px-0 gap-2'
        )}
      >
        <div
          className={cn(
            'shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-stone-50 dark:from-stone-800 dark:to-stone-900 border border-stone-200 dark:border-white/10 shadow-lg flex items-center justify-center p-2 hover:rotate-6 transition-all duration-500 group cursor-pointer',
            isCollapsed && 'w-11 h-11'
          )}
        >
          <div className="flex items-center justify-center w-full h-full text-amber-500 font-serif font-black text-2xl italic tracking-tighter drop-shadow-sm">
            BH
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0 flex-1 justify-center py-1">
            <Link href="/dashboard/profile" className="group/profile block w-full min-w-0">
              <span className="block text-[11px] font-black uppercase leading-[1.3] tracking-wider text-stone-900 dark:text-stone-100 group-hover/profile:text-amber-600 transition-colors truncate">
                {profile.full_name || 'NGƯỜI DÙNG'}
              </span>
            </Link>
            <div className="flex items-center gap-2 mt-1 overflow-hidden">
              <Badge
                variant="gold"
                className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm shrink-0 h-[16px] flex items-center"
              >
                {role}
              </Badge>
              <span className="text-[9px] font-medium text-stone-500 dark:text-stone-400 opacity-80 italic tracking-tight truncate flex-1">
                {greeting} {getDisplayName(profile).split(' ').pop()}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
