'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getDisplayName } from '@/lib/utils/names';
import { Profile } from '@/contexts/ProfileContext';
import type { UserRole } from '@/lib/auth/core';
import { ChevronLeft } from 'lucide-react';

interface SidebarHeaderProps {
  profile: Profile;
  isCollapsed: boolean;
  onClose?: () => void;
}

export const SidebarHeader = memo(function SidebarHeader({
  profile,
  isCollapsed,
  onClose,
}: SidebarHeaderProps) {
  const [greeting, setGreeting] = useState('Xin chào');
  const [imgError, setImgError] = useState(false);
  const role = (profile.role ?? 'student') as UserRole;

  const avatarSrc = profile?.photo_url || profile?.avatar_url;

  useEffect(() => {
    setImgError(false);
  }, [avatarSrc]);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Chào buổi sáng');
    else if (hours < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  const initials = useMemo(() => {
    if (profile?.last_name && profile?.first_name) {
      return `${profile.last_name[0] || ''}${profile.first_name[0] || ''}`.toUpperCase();
    }
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const first = parts[0] || '';
        const last = parts[parts.length - 1] || '';
        return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0]) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    return 'U';
  }, [profile]);

  return (
    <div className="flex flex-col border-b border-stone-100 dark:border-white/5 pb-3.5 relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Top Status Bar with Brand Logo */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              title="Về Trang giới thiệu (Landing Page)"
              className="flex items-center gap-2 group"
            >
              <div className="relative w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 p-0.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="BH-EDU Logo"
                  fill
                  sizes="20px"
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] font-black text-stone-700 dark:text-stone-300 group-hover:text-amber-600 transition-colors uppercase tracking-wider">
                BH-EDU
              </span>
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20 shadow-2xs">
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider leading-none">
                  HKII-2025
                </span>
              </div>

              {/* Mobile close button integrated smoothly */}
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label="Đóng menu"
                  className="lg:hidden p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-all active:scale-95 flex items-center justify-center border border-stone-200/60 dark:border-stone-700"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex justify-center py-1.5">
            <Link
              href="/"
              title="Về Trang giới thiệu (Landing Page)"
              className="relative w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 overflow-hidden block hover:scale-105 transition-transform"
            >
              <Image src="/logo.png" alt="BH-EDU" fill sizes="24px" className="object-contain" />
            </Link>
          </div>
        )}
      </div>

      {/* User Profile Section with User Avatar */}
      <div
        className={cn(
          'px-4 flex items-center gap-3 transition-all duration-300',
          isCollapsed && 'flex-col px-0 gap-2'
        )}
      >
        <Link
          href="/dashboard/profile"
          title="Hồ sơ cá nhân"
          className={cn(
            'relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/40 shadow-2xs flex items-center justify-center text-white font-bold text-xs hover:rotate-3 transition-all duration-300 group cursor-pointer overflow-hidden',
            isCollapsed && 'w-9 h-9'
          )}
        >
          {avatarSrc && !imgError ? (
            <img
              src={avatarSrc}
              alt={profile.full_name || 'User avatar'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="tracking-tighter">{initials}</span>
          )}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#14120E] bg-emerald-500" />
        </Link>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <Link href="/dashboard/profile" className="group/profile block w-full min-w-0">
              <span className="block text-xs font-black uppercase leading-tight tracking-wide text-stone-900 dark:text-stone-100 group-hover/profile:text-amber-600 transition-colors truncate">
                {profile.full_name || 'NGƯỜI DÙNG'}
              </span>
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
              <Badge
                variant="gold"
                className="text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded-md shadow-2xs shrink-0 h-[15px] flex items-center"
              >
                {role}
              </Badge>
              <span className="text-[9.5px] font-medium text-stone-500 dark:text-stone-400 opacity-80 italic tracking-tight truncate flex-1">
                {greeting} {getDisplayName(profile).split(' ').pop()}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
