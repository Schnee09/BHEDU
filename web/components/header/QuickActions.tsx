'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlusIcon } from '@heroicons/react/24/outline';

interface QuickActionItem {
  label: string;
  icon: React.ElementType;
  href: string;
  show: boolean;
}

interface QuickActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  actions: QuickActionItem[];
}

export function QuickActions({ isOpen, onToggle, onClose, actions }: QuickActionsProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative border',
          isOpen
            ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
            : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 border-transparent hover:border-amber-500/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:scale-105'
        )}
        title="Thao tác nhanh"
      >
        <PlusIcon
          className={cn(
            'w-5 h-5 transition-transform duration-300 text-stone-500 group-hover:text-amber-500',
            isOpen && 'rotate-45 text-white'
          )}
          strokeWidth={2.5}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in md:bg-transparent md:backdrop-blur-none"
            onClick={onClose}
          />
          <div
            className={cn(
              'fixed inset-x-0 bottom-0 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-64 md:py-2',
              'bg-white dark:bg-[#1C1A16] border-t md:border border-stone-200 dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]',
              'rounded-t-[32px] md:rounded-[24px] transition-all duration-500 ease-out animate-fade-in-up md:animate-scale-in md:origin-top-right flex flex-col overflow-hidden',
              'pb-4 md:pb-0'
            )}
          >
            <div className="px-5 py-4 md:py-3 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 md:mb-2">
              <p className="font-black text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest text-center md:text-left">
                Thao tác nhanh
              </p>
            </div>
            <div className="py-2 md:py-0 overflow-y-auto">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-sm font-bold text-stone-700 dark:text-stone-300 group"
                >
                  <div className="p-1.5 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>

            <div className="p-4 border-t border-stone-100 dark:border-white/5 md:hidden mt-2">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-stone-100 dark:bg-white/5 font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
