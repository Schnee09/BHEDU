'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../ui/Icons';

interface UserProfile {
  id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string;
}

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  profile: UserProfile | null;
  initials: string;
}

export function UserMenu({
  isOpen,
  onToggle,
  onClose,
  onLogout,
  profile,
  initials,
}: UserMenuProps) {
  return (
    <div className="hidden md:block relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 p-1 pr-4 rounded-full transition-all duration-300 cursor-pointer group
        bg-stone-100/40 dark:bg-white/5 border border-transparent hover:border-amber-500/50 hover:bg-white hover:shadow-lg hover:shadow-amber-500/10 hover:scale-105"
      >
        <div className="relative p-0.5">
          {/* Metric Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 transform"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-stone-200 dark:text-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#avatar-gradient)"
              strokeWidth="6"
              strokeDasharray="289"
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="w-8 h-8 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs md:text-sm relative z-10 shadow-sm overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1C1A16] bg-green-500 z-20" />
        </div>
        <div className="text-left hidden xl:block min-w-0">
          <p className="text-sm font-bold text-stone-900 dark:text-white leading-none mb-1 group-hover:text-amber-600 transition-colors truncate max-w-[120px]">
            {profile?.first_name || profile?.full_name?.split(/\s+/).pop() || 'User'}
          </p>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-[8px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">
              {profile?.role || 'USER'}
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <div
            className="absolute top-24 right-4 md:right-0 w-72 py-3 z-[110] overflow-hidden rounded-[24px] animate-scale-in origin-top-right
          bg-white dark:bg-[#1C1A16] border border-stone-200 dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
          >
            <div className="px-6 py-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
              <p className="font-bold text-stone-900 dark:text-white tracking-tight">
                {profile?.full_name || 'Hồ sơ'}
              </p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                {profile?.email}
              </p>
            </div>

            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-all text-sm font-bold text-stone-700 dark:text-stone-300 group"
            >
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Icons.User className="w-4 h-4" />
              </div>
              Hồ sơ của tôi
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-all text-sm font-black text-stone-700 dark:text-stone-300 group"
            >
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Icons.Settings className="w-4 h-4" />
              </div>
              Cài đặt
            </Link>

            <div className="border-t border-stone-100 dark:border-white/5 my-1" />

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-bold text-red-600 dark:text-red-400 group"
            >
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Icons.Logout className="w-4 h-4" />
              </div>
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}
