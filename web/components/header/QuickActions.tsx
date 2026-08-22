'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Sparkles } from 'lucide-react';

export interface QuickActionItem {
  label: string;
  sub?: string;
  category?: string;
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
  const visibleActions = actions.filter((a) => a.show);

  // Group actions by category if provided
  const categories = Array.from(new Set(visibleActions.map((a) => a.category || 'Tác vụ nhanh')));

  return (
    <div className="relative font-['Be_Vietnam_Pro']">
      <button
        onClick={onToggle}
        className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer relative border',
          isOpen
            ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
            : 'bg-stone-100 dark:bg-[#1C1A16] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:border-amber-500/30 hover:bg-stone-50 dark:hover:bg-[#25221D] hover:shadow-sm hover:scale-105'
        )}
        title="Thao tác nhanh"
      >
        <PlusIcon
          className={cn(
            'w-5 h-5 transition-transform duration-300 text-stone-500 dark:text-stone-400 group-hover:text-amber-500',
            isOpen && 'rotate-45 text-white'
          )}
          strokeWidth={2.5}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/60 md:bg-transparent"
            onClick={onClose}
          />
          <div
            className={cn(
              'fixed inset-x-4 bottom-4 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-80 md:py-2',
              'bg-white dark:bg-[#14120E] border-2 border-stone-200 dark:border-stone-800 shadow-2xl',
              'rounded-3xl transition-all duration-200 animate-scale-in origin-top-right flex flex-col overflow-hidden',
              'max-h-[85vh] md:max-h-[550px]'
            )}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-black text-xs text-stone-900 dark:text-white uppercase tracking-wider">
                    Thao tác nhanh
                  </p>
                  <p className="text-[10px] text-stone-400 font-medium">Lối tắt tác vụ hàng ngày</p>
                </div>
              </div>
            </div>

            {/* List by Category */}
            <div className="p-2 overflow-y-auto space-y-3 custom-scrollbar bg-white dark:bg-[#14120E]">
              {categories.map((cat) => {
                const catActions = visibleActions.filter((a) => (a.category || 'Tác vụ nhanh') === cat);
                return (
                  <div key={cat} className="space-y-1">
                    <p className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                      {cat}
                    </p>
                    <div className="space-y-0.5">
                      {catActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={action.href + action.label}
                            href={action.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-amber-500/10 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#201D18] group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="truncate block">{action.label}</span>
                              {action.sub && (
                                <span className="text-[10px] text-stone-400 font-normal truncate block">
                                  {action.sub}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile close button */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 md:hidden bg-stone-50 dark:bg-[#1A1814]">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-stone-200 dark:bg-stone-800 font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs"
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
